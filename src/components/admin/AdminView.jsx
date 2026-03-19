// src/components/admin/AdminView.jsx - composicao enxuta do dashboard administrativo a partir de blocos independentes.
import { AdminHeader } from "./AdminHeader";
import { AppointmentList } from "./AppointmentList";
import { BrandManager } from "./BrandManager";
import { CrmPanel } from "./CrmPanel";
import { LogsPanel } from "./LogsPanel";
import { OccupancyHeatmap } from "./OccupancyHeatmap";
import { ScheduleEditor } from "./ScheduleEditor";
import { StaffManager } from "./StaffManager";

/**
 * @param {any} props
 */
export function AdminView(props) {
  const cx = { layout: "layout-grid single-column", twoCol: "admin-columns" };
  return (
    <section className={cx.layout}>
      <AdminHeader adminStats={props.adminStats} occupancyStats={props.occupancyStats} realtimeStatusLabel={props.realtimeStatusLabel} weeklyDemandNarrative={props.weeklyDemandNarrative} />
      <div className={cx.twoCol}>
        <OccupancyHeatmap occupancyHeatmap={props.occupancyHeatmap} scheduleConflicts={props.scheduleConflicts} />
        <StaffManager staffMembers={props.staffMembers} staffForm={props.staffForm} onStaffFormChange={props.onStaffFormChange} onSaveStaff={props.onSaveStaff} isSavingStaff={props.isSavingStaff} staffActionId={props.staffActionId} onEditStaffMember={props.onEditStaffMember} onToggleStaffActive={props.onToggleStaffActive} onResetStaffPassword={props.onResetStaffPassword} staffFeedback={props.staffFeedback} barbers={props.barbers} />
      </div>
      <BrandManager brandConfig={props.brandConfig} onBrandConfigChange={props.onBrandConfigChange} onSaveBrandSettings={props.onSaveBrandSettings} isSavingBrand={props.isSavingBrand} onUploadBrandLogo={props.onUploadBrandLogo} galleryPosts={props.galleryPosts} galleryEditorForm={props.galleryEditorForm} onGalleryEditorChange={props.onGalleryEditorChange} onSaveGalleryPost={props.onSaveGalleryPost} isSavingGalleryPost={props.isSavingGalleryPost} galleryActionId={props.galleryActionId} onEditGalleryPost={props.onEditGalleryPost} onCreateGalleryPost={props.onCreateGalleryPost} onToggleGalleryPostActive={props.onToggleGalleryPostActive} onUploadGalleryImage={props.onUploadGalleryImage} staffFeedback={props.staffFeedback} />
      <div className={cx.twoCol}>
        <ScheduleEditor editorForm={props.editorForm} onEditorChange={props.onEditorChange} editorAvailableSlots={props.editorAvailableSlots} editorServicesCatalog={props.editorServicesCatalog} onToggleEditorService={props.onToggleEditorService} onSaveAppointmentEdits={props.onSaveAppointmentEdits} isUpdatingAppointment={props.isUpdatingAppointment} editorTotals={props.editorTotals} barbers={props.barbers} blockForm={props.blockForm} onBlockFormChange={props.onBlockFormChange} onCreateBlock={props.onCreateBlock} blockFeedback={props.blockFeedback} scheduleBlocks={props.scheduleBlocks} blockActionId={props.blockActionId} onDeleteBlock={props.onDeleteBlock} />
        <LogsPanel logs={props.logs} />
      </div>
      <CrmPanel customers={props.customers} reactivationCandidates={props.reactivationCandidates} customerDrafts={props.customerDrafts} onCustomerDraftChange={props.onCustomerDraftChange} onSaveCustomerNotes={props.onSaveCustomerNotes} customerActionId={props.customerActionId} />
      <AppointmentList adminAppointments={props.adminAppointments} adminBarberFilter={props.adminBarberFilter} onAdminBarberFilterChange={props.onAdminBarberFilterChange} adminStatusFilter={props.adminStatusFilter} onAdminStatusFilterChange={props.onAdminStatusFilterChange} adminDateFilter={props.adminDateFilter} onAdminDateFilterChange={props.onAdminDateFilterChange} dateOptions={props.dateOptions} barbers={props.barbers} onBeginEditAppointment={props.onBeginEditAppointment} statusUpdateId={props.statusUpdateId} onStatusChange={props.onStatusChange} hydrateAppointmentView={props.hydrateAppointmentView} getAppointmentServiceList={props.getAppointmentServiceList} />
    </section>
  );
}
