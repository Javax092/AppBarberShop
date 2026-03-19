// src/types.js - tipos JSDoc compartilhados para documentar shapes do app em desenvolvimento.

/**
 * @typedef {{
 *   total: number,
 *   confirmed: number,
 *   cancelled: number,
 *   completed: number,
 *   today: number,
 *   grossRevenue: number,
 *   todayRevenue: number,
 *   averageTicket: number,
 *   topBarber?: { barber?: Barber, revenue?: number }
 * }} AdminStats
 */

/**
 * @typedef {{
 *   date: string,
 *   label: string,
 *   occupancyRate: number,
 *   heat: "low"|"medium"|"high"|"full",
 *   tooltip: string
 * }} OccupancyCell
 */

/**
 * @typedef {{
 *   barberId: string,
 *   barberName: string,
 *   cells: OccupancyCell[]
 * }} OccupancyRow
 */

/**
 * @typedef {{
 *   id: string,
 *   fullName: string,
 *   whatsapp: string,
 *   email?: string,
 *   notes?: string,
 *   visitCount?: number,
 *   completedVisitCount?: number,
 *   cancelledVisitCount?: number,
 *   lifetimeValue?: number,
 *   averageTicket?: number,
 *   cadenceDays?: number,
 *   lastAppointmentAt?: string|null,
 *   firstAppointmentAt?: string|null,
 *   lastServiceNames?: string[]
 * }} Customer
 */

/**
 * @typedef {{
 *   id: string,
 *   email: string,
 *   fullName: string,
 *   role: "admin"|"barber"|string,
 *   barberId?: string|null,
 *   isActive: boolean
 * }} StaffMember
 */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   caption: string,
 *   tag: string,
 *   imagePath?: string,
 *   imageUrl?: string,
 *   sortOrder?: number,
 *   isActive: boolean
 * }} GalleryPost
 */

/**
 * @typedef {{
 *   id: string,
 *   barberId: string,
 *   title: string,
 *   blockType: "unavailable"|"lunch"|"day_off"|string,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   isAllDay: boolean,
 *   notes?: string
 * }} ScheduleBlock
 */

/**
 * @typedef {{
 *   id: string,
 *   barberId: string,
 *   clientId?: string|null,
 *   clientName: string,
 *   clientWhatsapp: string,
 *   serviceIds: string[],
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   status: "confirmed"|"in-progress"|"done"|"cancelled"|"completed"|string,
 *   totalPrice: number,
 *   createdAt?: string,
 *   updatedAt?: string,
 *   notes?: string,
 *   services?: Service[]
 * }} Appointment
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   shortCode?: string,
 *   role?: string,
 *   phone?: string,
 *   specialty?: string,
 *   bio?: string,
 *   photoKey?: string,
 *   photoUrl?: string,
 *   heroTagline?: string,
 *   workingHours: { start: string, end: string },
 *   breakRanges?: Array<{ start: string, end: string }>,
 *   daysOff?: number[]
 * }} Barber
 */

/**
 * @typedef {{
 *   id: string,
 *   barberId: string,
 *   name: string,
 *   badge?: string,
 *   price: number,
 *   duration: number,
 *   category?: string,
 *   description?: string,
 *   isActive: boolean,
 *   sortOrder?: number
 * }} Service
 */

export {};
