import Calendar from "../components/Calendar"
import CreateEvent from "../components/CreateEvent";

export const Inicio = () => {


    

    return (
        <div className="row h-100 ">

            <div className="col">
            </div>
            {/* primera mitad */}
            <div className="col-7 p-3 rounded card calendar-container ">
                <Calendar />
            </div>
            {/* segunda mitad */}
            <div className="col-3 p-3 text-center card-1">
                    <section>HOY</section>

                <div className="card align-between p-3">
                    </div>
                    <section>ESTA SEMANA</section>
                <div className="card align-between p-3">
                    </div>
                    <section>SIN FECHA</section>
                <div className="card align-between p-3">
                    </div>

            </div>
            <div className="col">
            </div>

        </div>
    )
}
export default Inicio;