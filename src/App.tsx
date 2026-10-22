import './App.css'

function App() {

  return (
    <>
      <div className='flex flex-col space-y-4 text-white min-h-screen bg-[#cfe4ff] justify-center items-center px-4'>
        <h1 className='text-blue-500 font-bold text-5xl'>Servicio de Turno</h1>

        <p className='text-black'>Inscriba su RUT para dejar su turno</p>

        <div className='flex mt-4 flex-wrap gap-4 w-full max-w-7xl'>
          <div>
            <h1>Añadir a la cola</h1>
            <form className='flex flex-col gap-5'></form>
          </div>
        </div>

      </div>
    </>
  )
}

export default App
