const Restaurant = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Restaurante</h2>
      </div>
      <div className="grid gap-4">
        <p className="text-muted-foreground">
          Gestión de reservas y pedidos del restaurante.
        </p>
        {/* Aquí irá el contenido del restaurante */}
      </div>
    </div>
  );
};

export default Restaurant;
