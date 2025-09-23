export default function TasksSection({ title, children }) {
    return (
        <div className="w-full py-1 mb-4 m-0">
            <h2 className="text-md font-medium text-gray-600 mb-2">{title}</h2>
            <div className="bg-white my-card p-4 min-h-[80px]">
                {children}
            </div>
        </div>
    );
}