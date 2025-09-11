import { useState } from 'react';
import TasksSection from './TasksSection';
import TaskItem from './TaskItem';
import { Link } from 'react-router-dom';

{/*Arrays de ejemplo*/ }
const tasks = {
    atrasado: [
        { id: 1, text: "Estudiar", color: "text-purple-600" },
        { id: 2, text: "Limpiar", color: "text-yellow-600" },
        { id: 3, text: "Hacer los deberes", color: "text-green-600" },
    ],
    conFecha: {
        "Lunes, 25 de agosto": [{ id: 4, text: "Hacer la cama", color: "text-green-600", repeat: true }],
        "Jueves, 12 de septiembre": [{ id: 8, text: "Viajar a Madrid", color: "text-pink-600", repeat: false }],
    },
    sinFecha: [
        { id: 5, text: "Leer un libro", color: "text-blue-600" },
        { id: 6, text: "Organizar escritorio", color: "text-red-600" },
        { id: 7, text: "Llamar al dentista", color: "text-indigo-600" },
    ],
};

export default function Tasks() {
    {/*Variable de estado que controla si es visible o no*/ }
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    {/*Variable de estaddo que controla si estan marcados los checkbox*/ }
    const [activeFilters, setActiveFilters] = useState({
        atrasado: true,
        conFecha: true,
        sinFecha: true
    });
    {/*Alterna un filtro específico (activado/desactivado)*/ }
    const toggleFilter = (filterType) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterType]: !prev[filterType]
        }));
    };
    {/*Pone los checkbox desactivados (Limpia)*/ }
    const clearAllFilters = () => {
        setActiveFilters({
            atrasado: false,
            conFecha: false,
            sinFecha: false
        });
    };
    {/*Pone los checkbox activados*/ }
    const selectAllFilters = () => {
        setActiveFilters({
            atrasado: true,
            conFecha: true,
            sinFecha: true
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 border-gray-400">

            {/* Encabezado */}
            <div className="relative w-full max-w-lg mb-4 flex items-center">
                {/* Botón Calendario (izquierda con Link) */}
                <Link
                    to="/calendario"
                    className="absolute left-0 top-3 text-sky-600 text-sm hover:text-sky-800 transition-colors"
                >
                    Inicio
                </Link>
                <h1 className="text-2xl font-bold mx-auto">Tareas</h1>
                <button
                    onClick={() => setShowFilterPopup(true)}
                    className="absolute right-0 top-3 text-sky-600 text-sm hover:text-sky-800 transition-colors"
                >
                    Filtrar
                </button>
            </div>

            {/* Contenedor general */}
            <div className="w-full max-w-2xl border border-gray-300 shadow-md rounded-2xl bg-white p-10 space-y-20">
                {/* Sección Atrasado */}
                {activeFilters.atrasado && (
                    <TasksSection title="Atrasado">
                        {tasks.atrasado.map((task) => (
                            <TaskItem key={task.id} {...task} />
                        ))}
                    </TasksSection>
                )}

                {/* Sección con fecha */}
                <div>
                    {activeFilters.conFecha && Object.entries(tasks.conFecha).map(([date, taskList]) => (
                        <TasksSection key={date} title={date}>
                            {taskList.map((task) => (
                                <TaskItem key={task.id} {...task} />
                            ))}
                        </TasksSection>
                    ))}
                </div>
                {/* Sección Sin fecha */}
                {activeFilters.sinFecha && (
                    <TasksSection title="Sin fecha">
                        {tasks.sinFecha.length > 0 ? (
                            tasks.sinFecha.map((task) => <TaskItem key={task.id} {...task} />)
                        ) : (
                            <div className="text-gray-400 text-sm p-4">No hay tareas</div>
                        )}
                    </TasksSection>
                )}

                {/* Mensaje cuando no hay filtros activos */}
                {!activeFilters.atrasado && !activeFilters.conFecha && !activeFilters.sinFecha && (
                    <div className="text-center text-gray-400 py-8">
                        <p className="text-lg">No hay filtros seleccionados</p>
                        <p className="text-sm">Usa el botón "Filtrar" para mostrar tareas</p>
                    </div>
                )}
            </div>

            {/* Popup de Filtros */}
            {showFilterPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Filtrar Tareas</h3>
                            <button
                                onClick={() => setShowFilterPopup(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Opción Atrasado */}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.atrasado}
                                    onChange={() => toggleFilter('atrasado')}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                                <span className="text-gray-700">Tareas Atrasadas</span>
                                <span className="ml-auto text-sm text-gray-500">({tasks.atrasado.length})</span>
                            </label>

                            {/* Opción Con Fecha */}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.conFecha}
                                    onChange={() => toggleFilter('conFecha')}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Tareas con Fecha</span>
                                <span className="ml-auto text-sm text-gray-500">
                                    ({Object.values(tasks.conFecha).flat().length})
                                </span>
                            </label>

                            {/* Opción Sin Fecha */}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.sinFecha}
                                    onChange={() => toggleFilter('sinFecha')}
                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="text-gray-700">Tareas sin Fecha</span>
                                <span className="ml-auto text-sm text-gray-500">({tasks.sinFecha.length})</span>
                            </label>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={clearAllFilters}
                                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Limpiar Todo
                            </button>
                            <button
                                onClick={selectAllFilters}
                                className="flex-1 px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
                            >
                                Seleccionar Todo
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilterPopup(false)}
                            className="w-full mt-3 px-4 py-2 text-sky-600 font-medium hover:bg-sky-50 rounded-lg transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Estilos CSS personalizados */}
            <style>{`
                .circular-checkbox {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid;
                    background-color: white;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s ease;
                }
                
                .circular-checkbox:checked {
                    background-color: currentColor;
                }
                
                .circular-checkbox:checked::after {
                    content: '';
                    position: absolute;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .circular-checkbox:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}



