import { useState } from "react";

export default function TaskItem({ text, color, repeat }) {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (e) => {
        setIsChecked(e.target.checked);
    };

    return (
        <div className="flex items-center gap-3 py-1">
            {/* Checkbox circular personalizado */}
            <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className={`circular-checkbox ${color.replace("text", "border")} ${color}`}
            />

            {/* Texto */}
            <span className={`text-md transition-all duration-200 ${isChecked ? "line-through text-gray-400" : color}`}>
                {text}
            </span>

            {/* Repetir icono */}
            {repeat && <span className="text-gray-400 text-base">🔁</span>}
        </div>
    );
}