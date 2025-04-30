import { TrashIcon, ReplyIcon } from "lucide-react";

const DeleteMessageReciver = ({
  visible,
  deleteFromMe,
  onReply,
  onClose,
  position = { top: "3rem", right: "1rem" }, // Default position, can be customized
}) => {
  if (!visible) return null;

  return (
    <>
      {/* Invisible overlay to capture clicks outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Actual popup */}
      <div
        className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 w-64 border border-gray-200 dark:border-gray-700"
        style={{
          top: position.top,
          right: position.right,
        }}
      >
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
          Delete Message
        </h3>

        <div className="space-y-1">
          <button
            className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-2 rounded transition-colors"
            onClick={deleteFromMe}
          >
            <TrashIcon
              size={16}
              className="mr-2 text-gray-500 dark:text-gray-400"
            />
            Delete for me
          </button>
          {/* Reply button */}
          <button
            className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-2 rounded transition-colors"
            onClick={onReply}
          >
            <ReplyIcon
              size={16}
              className="mr-2 text-gray-500 dark:text-gray-400"
            />
            Reply
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-1">
            <button
              className="flex items-center w-full text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-2 rounded transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteMessageReciver;
