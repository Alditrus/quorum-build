import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Message } from './Message';
import { Message as MessageType, Role, Emoji, Sticker } from '../../api/quorumApi';

type PinnedMessageOverlayProps = {
  message: MessageType;
  messageList: MessageType[];
  onClose: () => void;
  mapSenderToUser: (senderId: string) => any;
  customEmoji?: Emoji[];
  stickers?: {[key: string]: Sticker};
  senderRoles: Role[];
  canEditRoles?: boolean;
  canDeleteMessages?: boolean;
  setInReplyTo: React.Dispatch<React.SetStateAction<MessageType | undefined>>;
  repudiability?: boolean;
  editorRef: any;
  height: number;
  submitMessage: (message: any) => Promise<void>;
  kickUserAddress?: string;
  setKickUserAddress?: React.Dispatch<React.SetStateAction<string | undefined>>;
  onPinMessage: (messageId: string) => void;
};

export const PinnedMessageOverlay: React.FC<PinnedMessageOverlayProps> = ({
  message,
  messageList,
  onClose,
  mapSenderToUser,
  customEmoji,
  stickers,
  senderRoles,
  canEditRoles,
  canDeleteMessages,
  setInReplyTo,
  repudiability,
  editorRef,
  height,
  submitMessage,
  kickUserAddress,
  setKickUserAddress,
  onPinMessage,
}) => {
  const [hoverTarget, setHoverTarget] = useState<string>();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string>();
  const [emojiPickerOpenDirection, setEmojiPickerOpenDirection] = useState<string>();

  return (
    <div className="relative z-[100]">
      <div className="bg-[#3f353c] border-b border-slate-50/10 shadow-lg">
        <div className="flex flex-row items-start">
          <div className="flex-grow">
            <Message
              customEmoji={customEmoji}
              stickers={stickers}
              message={message}
              messageList={messageList}
              senderRoles={senderRoles}
              canEditRoles={canEditRoles}
              canDeleteMessages={canDeleteMessages}
              mapSenderToUser={mapSenderToUser}
              virtuosoRef={undefined}
              emojiPickerOpen={emojiPickerOpen}
              setEmojiPickerOpen={setEmojiPickerOpen}
              emojiPickerOpenDirection={emojiPickerOpenDirection}
              setEmojiPickerOpenDirection={setEmojiPickerOpenDirection}
              hoverTarget={hoverTarget}
              setHoverTarget={setHoverTarget}
              setInReplyTo={setInReplyTo}
              repudiability={repudiability}
              editorRef={editorRef}
              height={height}
              submitMessage={submitMessage}
              kickUserAddress={kickUserAddress}
              setKickUserAddress={setKickUserAddress}
              onPinMessage={onPinMessage}
              isPinned={true}
            />
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 mr-4 mt-2 w-8 h-8 rounded-md hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faChevronUp} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
