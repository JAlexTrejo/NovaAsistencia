// Convierte lista de columnas en string para .select()
export const cols = (...c: string[]) => c.join(',');
// Algunos selects anidados pueden quedarse como template string multilinea si lo prefieres.
