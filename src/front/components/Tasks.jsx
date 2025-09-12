import { useState, useEffect } from 'react';
import TasksSection from './TasksSection';
import TaskItem from './TaskItem';


export default function Tasks() {
     // Estado para las tareas obtenidas de la API
    const [tasks, setTasks] = useState({
        atrasado: [],
        conFecha: {},
        sinFecha: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ID del usuario 
    const userId = 1; // Cambiar por ID real del usuario

    // Variable de estado que controla si es visible o no*/ 
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    // Variable de estaddo que controla si estan marcados los checkbox
    const [activeFilters, setActiveFilters] = useState({
        atrasado: true,
        conFecha: true,
        sinFecha: true
    });

    // Función para obtener tareas de la API
    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${userId}/tasks`);
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const apiTasks = await response.json();
            
            // Procesar y categorizar las tareas
            const processedTasks = processTasks(apiTasks);
            setTasks(processedTasks);
            
        } catch (err) {
            console.error('Error al obtener tareas:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para procesar y categorizar las tareas
    const processTasks = (apiTasks) => {
        const now = new Date();
        const categorizedTasks = {
            atrasado: [],
            conFecha: {},
            sinFecha: [],
        };

        apiTasks.forEach(task => {
            // Mapear los campos de la API a la estructura del componente
            const processedTask = {
                id: task.id,
                text: task.title,
                color: task.color || "text-gray-600",
                repeat: task.recurrencia !== null,
                status: task.status,
                date: task.date
            };

            if (task.date) {
                const taskDate = new Date(task.date);
                
                // Si la tarea tiene fecha y está vencida
                if (taskDate < now && task.status === 'pending') {
                    categorizedTasks.atrasado.push(processedTask);
                } else {
                    // Formatear la fecha para mostrar
                    const formattedDate = formatDate(taskDate);
                    
                    if (!categorizedTasks.conFecha[formattedDate]) {
                        categorizedTasks.conFecha[formattedDate] = [];
                    }
                    categorizedTasks.conFecha[formattedDate].push(processedTask);
                }
            } else {
                // Tareas sin fecha
                categorizedTasks.sinFecha.push(processedTask);
            }
        });

        return categorizedTasks;
    };

    // Función para formatear fecha
    const formatDate = (date) => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const dia = dias[date.getDay()];
        const numeroDate = date.getDate();
        const mes = meses[date.getMonth()];
        
        return `${dia}, ${numeroDate} de ${mes}`;
    };

     // Función para crear una nueva tarea
    const createTask = async (taskData) => {
        try {
            const response = await fetch(`/api/users/${userId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Recargar las tareas después de crear una nueva
            await fetchTasks();
            
        } catch (err) {
            console.error('Error al crear tarea:', err);
            setError(err.message);
        }
    };

     // Función para eliminar una tarea
    const deleteTask = async (taskId) => {
        try {
            const response = await fetch(`/api/users/${userId}/tasks/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Recargar las tareas después de eliminar
            await fetchTasks();
            
        } catch (err) {
            console.error('Error al eliminar tarea:', err);
            setError(err.message);
        }
    };

     // Función para actualizar una tarea
    const updateTask = async (taskId, updateData) => {
        try {
            const response = await fetch(`/api/users/${userId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Recargar las tareas después de actualizar
            await fetchTasks();
            
        } catch (err) {
            console.error('Error al actualizar tarea:', err);
            setError(err.message);
        }
    };

    // Cargar tareas al montar el componente
    useEffect(() => {
        fetchTasks();
    }, []);



    // (activado/desactivado)
    const toggleFilter = (filterType) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterType]: !prev[filterType]
        }));
    };
    // Pone los checkbox desactivados (Limpia)
    const clearAllFilters = () => {
        setActiveFilters({
            atrasado: false,
            conFecha: false,
            sinFecha: false
        });
    };
    // Pone los checkbox activados
    const selectAllFilters = () => {
        setActiveFilters({
            atrasado: true,
            conFecha: true,
            sinFecha: true
        });
    };

    // Si está cargando
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando tareas...</p>
                </div>
            </div>
        );
    }

    // Si hay error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error al cargar tareas: {error}</p>
                    <button 
                        onClick={fetchTasks}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 border-gray-400">

            {/* Encabezado */}
            <div className="relative w-full max-w-lg mb-4 flex items-center">
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



