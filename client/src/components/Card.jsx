export default function Card({ title, value, icon }) {
    return (
      <div className="bg-white p-5 rounded-xl shadow flex items-center justify-between">
        <div>
          <p className="text-gray-500">{title}</p>
          <h2 className="text-xl font-bold">{value}</h2>
        </div>
        <div className="text-2xl text-orange-500">{icon}</div>
      </div>
    );
  }