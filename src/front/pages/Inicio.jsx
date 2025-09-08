import Calendar from "../components/Calendar"
export const Inicio = () => {
    return (
        <div className="row h-100 ">
            <div className="col"></div>
            {/* primera mitad */}
            <div className="col-7 p-3 rounded card div4">
                <Calendar />
            </div>
            {/* segunda mitad */}
            <div className="col-3 text-center">
                    <section>hoy</section>
                <div className="card align-between p-3">
                    </div>
                    <section>esta semana</section>
                <div className="card align-between p-3">
                    </div>
                    <section>sin fecha</section>
                <div className="card align-between p-3">
                    </div>

            </div>
            <div className="col"></div>

        </div>
    )
}
export default Inicio;