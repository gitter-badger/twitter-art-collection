import _ from "lodash";
import { useSession } from "next-auth/react";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AiOutlinePlusCircle as PlusCircle,
  AiOutlineCloseCircle as CloseCircle,
} from "react-icons/ai";
import { GiHamburgerMenu as MenuIcon } from "react-icons/gi";
import { putTags } from "src/adapters";
import { useEditMode } from "src/context/EditModeContext";
import { useSelectedTag } from "src/context/SelectedTagContext";
import { useStore } from "src/stores/rootStore";
import styled from "styled-components";
import { PopupItem, StyledPopup, StyledTab } from "..";

const BUTTON_SIZE = 35;

type TabContainerProps = HTMLAttributes<HTMLDivElement> & {
  overflowing?: boolean;
};

const MainContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  overflow: hidden;
`;

const TabContainer = styled.div<TabContainerProps & { overflow?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: start;
  overflow: hidden;
  width: 100%;

  ${(props) =>
    props.overflowing
      ? "mask: linear-gradient(90deg, black 85%, transparent);"
      : ""}
`;

const StyledButton = styled.div`
  color: var(--secondary);
  padding: 0;
  margin: 0;
  height: ${BUTTON_SIZE}px;
  width: ${BUTTON_SIZE}px;
`;

const Tab = styled(StyledTab)`
  padding: 5px 10px;
  margin: 0 5px;

  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

/**
 * Add image component
 */
function AddImagesPopupListItem(props: {
  tag: TagSchema;
  image: ImageSchema;
  close: Function;
  key: number;
}) {
  const session = useSession();
  const addImage = useStore((state) => state.addImage);

  const onClick = useCallback(() => {
    if (session.data) {
      addImage(props.tag, props.image);

      props.close();
    }
  }, [addImage, props, session.data]);

  return <PopupItem text={props.tag.name} key={props.key} onClick={onClick} />;
}

/**
 * Main Component
 * @param props
 * @returns
 */
export default function TweetTags(props: { image: ImageSchema }) {
  const { selectedTag, setSelection } = useSelectedTag();
  const { editMode } = useEditMode();

  const { includedTags, notIncludedTags, removeImage } = useStore(
    (state) => {
      const tags = Array.from(state.tags.values());

      const includedTags = tags.filter((tag) =>
        tag.images.find((im) => im.id === props.image.id)
      );
      const notIncludedTags = tags.filter(
        (tag) => !tag.images.find((im) => im.id === props.image.id)
      );

      return {
        includedTags,
        notIncludedTags,
        removeImage: state.removeImage,
      };
    },
    (prevState, nextState) => {
      // Ignore inner image changes
      return (
        _.isEqual(
          prevState.includedTags.map((tag) => tag.name),
          nextState.includedTags.map((tag) => tag.name)
        ) &&
        _.isEqual(
          prevState.notIncludedTags.map((tag) => tag.name),
          nextState.notIncludedTags.map((tag) => tag.name)
        )
      );
    }
  );

  const session = useSession();

  // Overflow detection
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    if (tagsContainerRef.current) {
      setOverflow(
        tagsContainerRef.current.offsetWidth <
          tagsContainerRef.current.scrollWidth
      );
    }
  }, []);

  return (
    <MainContainer>
      <StyledPopup
        trigger={useMemo(
          () => (
            <Tab>
              <StyledButton>
                <PlusCircle size={BUTTON_SIZE} onClick={() => {}} />
              </StyledButton>
            </Tab>
          ),
          []
        )}
        closeOnDocumentClick
      >
        {(close: Function) =>
          notIncludedTags.map((tag, key) => (
            <AddImagesPopupListItem
              key={key}
              tag={tag}
              image={props.image}
              close={close}
            />
          ))
        }
      </StyledPopup>
      <TabContainer ref={tagsContainerRef} overflowing={overflow}>
        {includedTags.map((tag, key) => (
          <Tab
            color={editMode !== "delete" ? undefined : "red"}
            key={key}
            active={tag === selectedTag}
            onClick={() => {
              if (editMode !== "delete") {
                setSelection(tag);
              } else if (session.data) {
                removeImage(tag, props.image);
              }
            }}
          >
            {editMode === "delete" ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginRight: "5px",
                }}
              >
                <CloseCircle size={20} />
              </div>
            ) : (
              <></>
            )}
            {tag.name}
          </Tab>
        ))}
      </TabContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginLeft: "auto",
        }}
        draggable={true}
      >
        <MenuIcon size={30} />
      </div>
    </MainContainer>
  );
}
