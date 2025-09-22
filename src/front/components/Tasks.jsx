import { useState, useMemo } from "react";
import TasksSection from "./TasksSection";
import TaskItem from "./TaskItem";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export default function Tasks({ tasks }) {
    const { store, dispatch } = useGlobalReducer();
    const taskGroups = store.taskGroup || [];

    // Combinar tareas con su color de grupo
    const tasksWithGroupColor = useMemo(() => {
        return (tasks || []).map(task => {
            const group = taskGroups.find(g => g.id === task.task_group_id);
            return {
                ...task,
                color: group?.color || '#292929ec'
            };
        });
    }, [tasks, taskGroups]);

    // Estado para los filtros
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        atrasado: true,
        conFecha: true,
        sinFecha: true
    });

    // Función para formatear fecha
    const formatDate = (date) => {
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const meses = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ];
        const dia = dias[date.getDay()];
        const numeroDate = date.getDate();
        const mes = meses[date.getMonth()];
        return `${dia}, ${numeroDate} de ${mes}`;
    };

    // Categorizar tareas
    const categorizedTasks = useMemo(() => {
        const now = new Date();
        const result = {
            atrasado: [],
            conFecha: {},
            sinFecha: [],
        };

        tasksWithGroupColor.forEach((task) => {
            // Normalizar campo de fecha: date > startDate > endDate
            const rawDate = task.date || task.startDate || task.endDate || null;

            if (rawDate) {
                const taskDate = new Date(rawDate);
                if (taskDate < now) {
                    result.atrasado.push(task);
                } else {
                    const formattedDate = formatDate(taskDate);
                    if (!result.conFecha[formattedDate]) {
                        result.conFecha[formattedDate] = [];
                    }
                    result.conFecha[formattedDate].push(task);
                }
            } else {
                result.sinFecha.push(task);
            }
        });

        return result;
    }, [tasksWithGroupColor]);

    // Acciones conectadas al store
    const updateTask = (taskId, updateData) => {
        dispatch({
            type: "UPDATE_TASK",
            payload: { id: taskId, ...updateData },
        });
    };

    const deleteTask = (taskId) => {
        dispatch({
            type: "DELETE_TASK",
            payload: taskId,
        });
    };

    // Filtros
    const toggleFilter = (filterType) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterType]: !prev[filterType],
        }));
    };

    const clearAllFilters = () => {
        setActiveFilters({
            atrasado: false,
            conFecha: false,
            sinFecha: false,
        });
    };

    const selectAllFilters = () => {
        setActiveFilters({
            atrasado: true,
            conFecha: true,
            sinFecha: true,
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-4 border-gray-400">
            <div className="w-full max-w-2xl border-gray-300 shadow-md rounded-2xl bg-white p-10 space-y-20">
                <div className="relative w-full max-w-lg mb-4 flex items-center">
                    <h1 className="text-2xl font-bold mx-auto">Tareas</h1>
                    <button
                        onClick={() => setShowFilterPopup(true)}
                        className="absolute right-0 top-3 text-sky-600 text-sm hover:text-sky-800 transition-colors"
                    >
                        Filtrar
                    </button>
                </div>

                {/* Sección Atrasado */}
                {activeFilters.atrasado && (
                    <TasksSection title="Atrasado">
                        {categorizedTasks.atrasado.length > 0 ? (
                            categorizedTasks.atrasado.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    {...task}
                                    color={task.color}
                                    onUpdate={updateTask}
                                    onDelete={deleteTask}
                                />
                            ))
                        ) : (
                            <div className="text-gray-400 text-sm p-4">No hay tareas</div>
                        )}
                    </TasksSection>
                )}

                {/* Sección con fecha */}
                {activeFilters.conFecha &&
                    Object.entries(categorizedTasks.conFecha).map(([date, taskList]) => (
                        <TasksSection key={date} title={date}>
                            {taskList.length > 0 ? (
                                taskList.map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        {...task}
                                        color={task.color}
                                        onUpdate={updateTask}
                                        onDelete={deleteTask}
                                    />
                                ))
                            ) : (
                                <div className="text-gray-400 text-sm p-4">No hay tareas</div>
                            )}
                        </TasksSection>
                    ))}

                {/* Sección Sin fecha */}
                {activeFilters.sinFecha && (
                    <TasksSection title="Sin fecha">
                        {categorizedTasks.sinFecha.length > 0 ? (
                            categorizedTasks.sinFecha.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    {...task}
                                    color={task.color}
                                    onUpdate={updateTask}
                                    onDelete={deleteTask}
                                />
                            ))
                        ) : (
                            <div className="text-gray-400 text-sm p-4">No hay tareas</div>
                        )}
                    </TasksSection>
                )}

                {/* Mensaje cuando no hay filtros activos */}
                {!activeFilters.atrasado &&
                    !activeFilters.conFecha &&
                    !activeFilters.sinFecha && (
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
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.atrasado}
                                    onChange={() => toggleFilter("atrasado")}
                                    className="circular-checkbox text-gray-600 focus:ring-red-500"
                                />
                                <span className="text-gray-700">Tareas Atrasadas</span>
                                <span className="ml-auto text-sm text-gray-500">
                                    ({categorizedTasks.atrasado.length})
                                </span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.conFecha}
                                    onChange={() => toggleFilter("conFecha")}
                                    className="circular-checkbox text-gray-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Tareas con Fecha</span>
                                <span className="ml-auto text-sm text-gray-500">
                                    {Object.values(categorizedTasks.conFecha).flat().length}
                                </span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.sinFecha}
                                    onChange={() => toggleFilter("sinFecha")}
                                    className="circular-checkbox text-gray-600 focus:ring-green-500"
                                />
                                <span className="text-gray-700">Tareas sin Fecha</span>
                                <span className="ml-auto text-sm text-gray-500">
                                    {categorizedTasks.sinFecha.length}
                                </span>
                            </label>
                        </div>

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
                
                .circular-checkbox:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}
