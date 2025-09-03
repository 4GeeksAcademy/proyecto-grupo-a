import React, { useState, useEffect } from "react";
import Lateral from "./Lateral";


export const Navbar = () => {
	const [openLateral, setOpenLateral] = useState(false);
	const [fecha, setFecha] = useState(new Date());

	useEffect(() => {
		const intervalo = setInterval(() => {
			setFecha(new Date());
		}, 1000); // actualiza cada segundo
		return () => clearInterval(intervalo);
	}, []);

	const opcionesFecha = {
		weekday: "long",
		day: "numeric",
		month: "long",
	};

	const opcionesHora = {
		hour: "2-digit",
		minute: "2-digit",
	};

	const fechaTexto = new Intl.DateTimeFormat("es-ES", opcionesFecha).format(
		fecha
	);
	const horaTexto = new Intl.DateTimeFormat("es-ES", opcionesHora).format(
		fecha
	);

	const toggleLateral = () => setOpenLateral(!openLateral);

	return (
		<div className="w-full">
			{/* Navigation Bar */}
			<div className="grid grid-cols-4 gap-2 text-center items-center bg-white border-b border-gray-200 p-4">
				{/* Date/Time */}
				<div className="col-span-1 text-sm text-gray-600">
					Hoy es {fechaTexto} a las {horaTexto}
				</div>

				{/* Navigation Links */}
				<div className="col-span-2 flex justify-center gap-4">
					<a
						href="/"
						className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
					>
						Inicio
					</a>
					<a
						href="/eventos"
						className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
					>
						Eventos y tareas
					</a>
				</div>

				{/* Profile */}
				<div className="col-span-1">
					<button
						className="w-full cursor-pointer hover:bg-gray-200 rounded py-2 px-4 text-sm font-medium text-gray-700 transition-colors"
						onClick={toggleLateral}
					>
						Perfil
					</button>
				</div>
			</div>

			{/* Lateral Panel */}
			{openLateral && <Lateral onClose={toggleLateral} />}
		</div>
	);
};