import { useState } from 'react';

export default function TaskItem({ id, text, color, repeat, status, onDelete, onUpdate }) {
    const [isCompleted, setIsCompleted] = useState(status === 'completed');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(text);

    // Manejar completar/descompletar tarea
    const handleToggleComplete = async () => {
        const newStatus = isCompleted ? 'pending' : 'completed';
        setIsCompleted(!isCompleted);
        
        try {
            await onUpdate({ status: newStatus });
        } catch (error) {
            // Revertir el estado si hay error
            setIsCompleted(isCompleted);
            console.error('Error al actualizar estado:', error);
        }
    };

    // Manejar edición de texto
    const handleSaveEdit = async () => {
        if (editText.trim() !== text) {
            try {
                await onUpdate({ title: editText.trim() });
                setIsEditing(false);
            } catch (error) {
                console.error('Error al actualizar tarea:', error);
                setEditText(text); // Revertir cambios
            }
        } else {
            setIsEditing(false);
        }
    };

    // Cancelar edición
    const handleCancelEdit = () => {
        setEditText(text);
        setIsEditing(false);
    };

    // Manejar eliminación
    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            try {
                await onDelete();
            } catch (error) {
                console.error('Error al eliminar tarea:', error);
            }
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-60' : ''}`}>
            <div className="flex items-center space-x-3 flex-1">
                {/* Checkbox para completar */}
                <button
                    onClick={handleToggleComplete}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-green-400'
                    }`}
                >
                    {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Texto de la tarea */}
                {isEditing ? (
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-sky-500"
                        autoFocus
                    />
                ) : (
                    <span 
                        className={`flex-1 cursor-pointer ${color} ${isCompleted ? 'line-through' : ''}`}
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {text}
                    </span>
                )}

                {/* Indicador de repetición */}
                {repeat && (
                    <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Botones de acción (aparecen en hover) */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isEditing && (
                    <>
                        {/* Botón editar */}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar tarea"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>

                        {/* Botón eliminar */}
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar tarea"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </>
                )}
                
                {isEditing && (
                    <>
                        {/* Botón guardar */}
                        <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-700 transition-colors"
                            title="Guardar cambios"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>

                        {/* Botón cancelar */}
                        <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Cancelar edición"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}