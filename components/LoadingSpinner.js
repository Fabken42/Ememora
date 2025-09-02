
export default function LoadingSpinner({ message = "Carregando" }) {
    return (
        <div className="max-w-2xl mx-auto p-6 flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>{message}</p>
            </div>
        </div>
    )
}