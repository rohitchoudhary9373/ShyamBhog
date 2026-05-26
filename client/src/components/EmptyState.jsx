export default function EmptyState({ text = "No Data Found" }) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-xl">{text}</p>
      </div>
    );
  }