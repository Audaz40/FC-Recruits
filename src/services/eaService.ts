import axios from 'axios';

// Configuración base para simular un navegador y evitar bloqueos de EA
const eaHttpClient = axios.create({
  baseURL: 'https://ea.com',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://ea.com'
  }
});

interface EAResponse {
  members: Array<{
    name: string;
    proLevel: number;
    gamesPlayed: number;
    goals: number;
    assists: number;
    ratingAverage: string; // EA lo devuelve como string a veces
    manOfTheMatch: number;
  }>;
}

// Algoritmo de control de fraude: verifica el GRL máximo según el nivel real de EA
const obtenerGrlMaximoPorNivel = (nivel: number): number => {
  if (nivel < 20) return 82;
  if (nivel < 50) return 86;
  if (nivel < 85) return 89;
  return 94; // Nivel máximo teórico (100)
};

export const verificarJugadorConEA = async (
  eaId: string,
  clubId: string,
  platform: string,
  grlDeclarado: number
) => {
  try {
    // Petición HTTP nativa al endpoint oficial de miembros de EA
    const response = await eaHttpClient.get<EAResponse>('/members/career/stats', {
      params: {
        platform: platform, // Ej: 'common-gen5' (PS5/Xbox Series/PC) o 'common-gen4'
        clubId: clubId      // El ID numérico del club del jugador
      }
    });

    const miembros = response.data.members;

    if (!miembros || miembros.length === 0) {
      return { valido: false, error: "El club especificado no existe o no tiene miembros activos." };
    }

    // Buscamos al jugador por su EA ID (ignorando mayúsculas/minúsculas)
    const jugador = miembros.find(m => m.name.toLowerCase() === eaId.toLowerCase());

    if (!jugador) {
      return { valido: false, error: "No se encontró al jugador dentro de los miembros de ese club." };
    }

    const nivelReal = jugador.proLevel;
    const grlMaximoPermitido = obtenerGrlMaximoPorNivel(nivelReal);

    // EL FILTRO DE LA VERDAD
    if (grlDeclarado > grlMaximoPermitido) {
      return {
        valido: false,
        error: `Fraude detectado. Tu nivel real en EA es ${nivelReal}. El GRL máximo para ese nivel es ${grlMaximoPermitido}, pero declaraste tener ${grlDeclarado}.`
      };
    }

    // Datos limpios e inalterables listos para el LinkedIn
    return {
      valido: true,
      mensaje: "¡Perfil verificado con éxito!",
      datosPerfil: {
        eaId: jugador.name,
        platform,
        grlVerificado: grlDeclarado,
        nivelEA: nivelReal,
        notaMedia: parseFloat(jugador.ratingAverage),
        partidos: jugador.gamesPlayed,
        goles: jugador.goals,
        asistencias: jugador.assists,
        mvp: jugador.manOfTheMatch,
        verificado: true
      }
    };

  } catch (error: any) {
    console.error("Error consultando la API de EA:", error.message);
    return { valido: false, error: "No se pudo conectar con los servidores de EA Sports FC en este momento." };
  }
};
