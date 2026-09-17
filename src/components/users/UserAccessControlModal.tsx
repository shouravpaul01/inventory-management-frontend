"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UserAccessControlModalProps } from "./access-control/types";
import { useAccessControlEngine } from "./access-control/useAccessControlEngine";
import UserAccessHeader from "./access-control/UserAccessHeader";
import RolesTabContent from "./access-control/RolesTabContent";
import OverridesTabContent from "./access-control/OverridesTabContent";
import MatrixTabContent from "./access-control/MatrixTabContent";
import UserAccessFooter from "./access-control/UserAccessFooter";
import UnsavedChangesDialog from "./access-control/UnsavedChangesDialog";

export type { UserAccessControlModalProps };

export default function UserAccessControlModal({
  open,
  onOpenChange,
  user,
  initialTab = "ROLES",
}: UserAccessControlModalProps) {
  const [unsavedPromptOpen, setUnsavedPromptOpen] = useState(false);

  const engine = useAccessControlEngine({
    open,
    user,
    initialTab,
    onSuccess: () => onOpenChange(false),
  });

  // Safe exit handler: prevents accidental loss of complex configuration
  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && engine.hasUnsavedChanges) {
      setUnsavedPromptOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleConfirmDiscardAndClose = () => {
    engine.handleDiscardAllChanges();
    setUnsavedPromptOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl">
          <Tabs
            value={engine.activeTab}
            onValueChange={(val) =>
              engine.setActiveTab(val as "ROLES" | "OVERRIDES" | "MATRIX")
            }
            className="flex flex-col h-full flex-1 overflow-hidden gap-0"
          >
            {/* 1. Header with Avatar, Details, Posture Pills, and Tabs */}
            <UserAccessHeader
              activeUser={engine.activeUser}
              selectedRoleIds={engine.selectedRoleIds}
              stats={engine.stats}
              hasUnsavedChanges={engine.hasUnsavedChanges}
              isRolesDirty={engine.isRolesDirty}
              isOverridesDirty={engine.isOverridesDirty}
              activeTab={engine.activeTab}
              onResetAllOverrides={engine.handleResetAllToRoleDefaults}
            />

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent
                value="ROLES"
                className="m-0 focus-visible:outline-none"
              >
                <RolesTabContent
                  filteredRoles={engine.filteredRoles}
                  selectedRoleIds={engine.selectedRoleIds}
                  roleSearchTerm={engine.roleSearchTerm}
                  setRoleSearchTerm={engine.setRoleSearchTerm}
                  isRolesLoading={engine.isRolesLoading}
                  isUserLoading={engine.isUserLoading}
                  toggleRole={engine.toggleRole}
                  onSelectAll={engine.handleSelectAllRoles}
                  onClearAll={engine.handleClearAllRoles}
                  onNavigateToOverrides={() => engine.setActiveTab("OVERRIDES")}
                />
              </TabsContent>

              <TabsContent
                value="OVERRIDES"
                className="m-0 focus-visible:outline-none"
              >
                <OverridesTabContent
                  activeUser={engine.activeUser}
                  allPermissions={engine.allPermissions}
                  overrideMap={engine.overrideMap}
                  stats={engine.stats}
                  permSearchTerm={engine.permSearchTerm}
                  setPermSearchTerm={engine.setPermSearchTerm}
                  selectedModule={engine.selectedModule}
                  setSelectedModule={engine.setSelectedModule}
                  filterTab={engine.filterTab}
                  setFilterTab={engine.setFilterTab}
                  modules={engine.modules}
                  moduleCountMap={engine.moduleCountMap}
                  groupedPermissions={engine.groupedPermissions}
                  isPermsLoading={engine.isPermsLoading}
                  isUserLoading={engine.isUserLoading}
                  getEffectiveState={engine.getEffectiveState}
                  onSetState={engine.handleSetState}
                  onBulkGrantModule={engine.handleBulkGrantModule}
                  onBulkRevokeModule={engine.handleBulkRevokeModule}
                  onResetModule={engine.handleResetModuleToDefaults}
                />
              </TabsContent>

              <TabsContent
                value="MATRIX"
                className="m-0 focus-visible:outline-none"
              >
                <MatrixTabContent
                  activeUser={engine.activeUser}
                  overrideMap={engine.overrideMap}
                  stats={engine.stats}
                  selectedRoleIds={engine.selectedRoleIds}
                  matrixSearchTerm={engine.matrixSearchTerm}
                  setMatrixSearchTerm={engine.setMatrixSearchTerm}
                  matrixModule={engine.matrixModule}
                  setMatrixModule={engine.setMatrixModule}
                  modules={engine.modules}
                  moduleCountMap={engine.moduleCountMap}
                  matrixFilteredPermissions={engine.matrixFilteredPermissions}
                  allPermissionsCount={engine.allPermissions.length}
                  getEffectiveState={engine.getEffectiveState}
                />
              </TabsContent>
            </div>

            {/* 3. Sticky Footer with Persistence Actions */}
            <UserAccessFooter
              hasUnsavedChanges={engine.hasUnsavedChanges}
              isSaving={engine.isSaving}
              onDiscard={engine.handleDiscardAllChanges}
              onClose={() => handleModalOpenChange(false)}
              onSave={engine.handleSaveAll}
            />
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 4. Unsaved Edits Guard Prompt */}
      <UnsavedChangesDialog
        open={unsavedPromptOpen}
        onOpenChange={setUnsavedPromptOpen}
        onConfirmDiscard={handleConfirmDiscardAndClose}
      />
    </>
  );
}
