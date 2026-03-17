export const services = [
  {
    id: "corte-classico",
    name: "Corte classico",
    badge: "Mais pedido",
    price: 45,
    duration: 40,
    category: "Cabelo",
    description: "Tesoura, maquina e acabamento de alta precisao."
  },
  {
    id: "barba-premium",
    name: "Barba premium",
    badge: "Toalha quente",
    price: 35,
    duration: 30,
    category: "Barba",
    description: "Contorno, toalha quente e finalizacao com balm."
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha",
    badge: "Detalhe fino",
    price: 15,
    duration: 15,
    category: "Detalhes",
    description: "Alinhamento rapido para completar o visual."
  },
  {
    id: "combo-executivo",
    name: "Combo executivo",
    badge: "Experiencia completa",
    price: 79,
    duration: 70,
    category: "Combo",
    description: "Corte, barba e acabamento premium no mesmo horario."
  }
];

export const barbers = [
  {
    id: "lucas",
    name: "Lucas",
    shortCode: "LC",
    role: "Master barber",
    phone: "5592999991111",
    specialty: "Precisao, acabamento classico e atendimento premium.",
    bio: "Perfil ideal para corte social, executivo e clientes recorrentes.",
    workingHours: {
      start: "09:00",
      end: "20:00"
    },
    breakRanges: [
      { start: "12:00", end: "13:00" }
    ],
    daysOff: [0]
  },
  {
    id: "luquinhas",
    name: "Luquinhas",
    shortCode: "LQ",
    role: "Style specialist",
    phone: "5592999992222",
    specialty: "Visagismo, barba premium e finalizacao moderna.",
    bio: "Ideal para combo completo, barba e servicos de detalhe.",
    workingHours: {
      start: "10:00",
      end: "21:00"
    },
    breakRanges: [
      { start: "14:00", end: "15:00" }
    ],
    daysOff: [1]
  }
];

export const sampleAppointments = [
  {
    id: "APT-1701",
    barberId: "lucas",
    clientName: "Rafael Souza",
    clientWhatsapp: "(92) 99999-1234",
    serviceIds: ["corte-classico", "sobrancelha"],
    date: "2026-03-18",
    startTime: "09:00",
    endTime: "09:55",
    status: "confirmed",
    createdAt: "2026-03-17T10:00:00-04:00",
    notes: "Cliente recorrente"
  },
  {
    id: "APT-1702",
    barberId: "lucas",
    clientName: "Bruno Alves",
    clientWhatsapp: "(92) 98888-4545",
    serviceIds: ["combo-executivo"],
    date: "2026-03-18",
    startTime: "13:30",
    endTime: "14:55",
    status: "confirmed",
    createdAt: "2026-03-17T10:10:00-04:00",
    notes: "Primeira visita"
  },
  {
    id: "APT-1703",
    barberId: "luquinhas",
    clientName: "Matheus Lima",
    clientWhatsapp: "(92) 97777-2233",
    serviceIds: ["barba-premium"],
    date: "2026-03-18",
    startTime: "10:00",
    endTime: "10:40",
    status: "confirmed",
    createdAt: "2026-03-17T10:20:00-04:00",
    notes: ""
  }
];
