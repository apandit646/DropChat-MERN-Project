import "./IncomingCallModal.css"; // Create CSS if needed

const IncomingCallModal = ({ visible, from, onAccept, onReject }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Incoming Call</h2>
        <p>{from} is calling...</p>
        <div className="modal-buttons">
          <button className="accept-btn" onClick={onAccept}>
            Accept
          </button>
          <button className="reject-btn" onClick={onReject}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
