import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons';
import { Message as MessageType } from '../../api/quorumApi';

type PinnedMessageNotificationProps = {
  message: MessageType;
  onClick: () => void;
};

export const PinnedMessageNotification: React.FC<PinnedMessageNotificationProps> = ({
  message,
  onClick,
}) => {
  const getMessagePreview = () => {
    if (message.content.type === 'post') {
      const text = Array.isArray(message.content.text)
        ? message.content.text[0]
        : message.content.text.split('\n')[0];
      return text.length > 50 ? text.substring(0, 50) + '...' : text + '...';
    } else if (message.content.type === 'embed') {
      return 'Image or video...';
    } else if (message.content.type === 'sticker') {
      return 'Sticker...';
    }
    return 'Message...';
  };

  return (
    <div
      onClick={onClick}
      className="sticky top-0 z-[100] bg-[#4f454c] border-b border-slate-50/10 px-4 py-2 cursor-pointer hover:bg-[#5f555c] transition-colors flex flex-row items-center gap-2"
    >
      <FontAwesomeIcon icon={faThumbtack} className="text-gray-400" />
      <span className="text-white text-sm">{getMessagePreview()}</span>
    </div>
  );
};
