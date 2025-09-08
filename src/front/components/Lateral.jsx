import React, { useState, useEffect } from "react";

// Componente Lateral separado
const Lateral = ({ onClose }) => {
	return (
		<div className="fixed inset-y-0 right-0 w-80 bg-gray-50 shadow-xl border-l border-gray-200 z-50">
			{/* Header */}
			<div className="flex items-center justify-between p-4 bg-white border-b">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 bg-gray-300 rounded-full"></div>
					<span className="font-medium text-gray-900">Usuario</span>
				</div>
				<div className="flex items-center space-x-2">
					<button className="p-1 text-gray-400 hover:text-gray-600">
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
						</svg>
					</button>
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600"
					>
						✕
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 space-y-6">
				{/* Calendarios */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-gray-900">Calendarios</h3>
						<button className="text-gray-400 hover:text-gray-600">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						</button>
					</div>
					<div className="space-y-2">
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-pink-400 rounded-full"></div>
							<span className="text-sm text-gray-700">Personal</span>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-red-500 rounded-full"></div>
							<span className="text-sm text-gray-700">Trabajo</span>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-green-300 rounded-full"></div>
							<span className="text-sm text-gray-700">Estudio</span>
						</div>
					</div>
				</div>

				{/* Tareas */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-gray-900">Tareas</h3>
						<button className="text-gray-400 hover:text-gray-600">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						</button>
					</div>
					<div className="space-y-2">
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-orange-400 rounded-full"></div>
							<span className="text-sm text-gray-700">Personal</span>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-teal-500 rounded-full"></div>
							<span className="text-sm text-gray-700">Trabajo</span>
						</div>
						<div className="flex items-center space-x-3">
							<div className="w-3 h-3 bg-green-600 rounded-full"></div>
							<span className="text-sm text-gray-700">Estudio</span>
						</div>
					</div>
				</div>
			</div>

			{/* Footer Settings */}
			<div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t items-center flex">
				<button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<span className="text-sm">Configuración</span>
				</button>
				<span className="text-sm flex justify-end">Log out</span>

			</div>
		</div>
	);
};
export default Lateral;