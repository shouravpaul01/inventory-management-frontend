"use client";

import React, { useState } from "react";
import {
  Shield,
  Building,
  Mail,
  Phone,
  KeyRound,
  PackageCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  QrCode,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/hooks";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import { useGetMyAssignedAssetsQuery } from "@/redux/api/reportsApi";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [changePassword, { isLoading: isChangingPass }] = useChangePasswordMutation();

  // Change password dialog state
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");

  const { data: myAssetsRes, isLoading: isAssetsLoading } = useGetMyAssignedAssetsQuery();
  const myAssets = myAssetsRes?.data || [];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword }).unwrap();
      toast.success("Security password updated successfully.");
      setIsPassModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update password. Please check your current password.");
    }
  };

  const filteredPermissions = (user?.permissions || []).filter((p) =>
    p.toLowerCase().includes(permissionFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty & Personnel Profile"
        description="Review personal authentication identity, departmental role assignments, active permission capabilities, and assigned inventory assets."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      >
        <Dialog open={isPassModalOpen} onOpenChange={setIsPassModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <KeyRound className="size-3.5" />
              <span>Change Password</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Security Password</DialogTitle>
              <DialogDescription>
                Provide your existing password and configure a new security credential.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-9 text-xs"
                    disabled={isChangingPass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New Password</label>
                <Input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="text-xs"
                  disabled={isChangingPass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                <Input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="text-xs"
                  disabled={isChangingPass}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPassModalOpen(false)}
                  disabled={isChangingPass}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isChangingPass}>
                  {isChangingPass ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Identity & Department */}
        <Card className="shadow-2xs border lg:col-span-1">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-primary/20 shadow-2xs mb-3">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <CardTitle className="text-lg font-bold">
              {user?.firstName} {user?.lastName}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              @{user?.username} • {user?.employeeId}
            </CardDescription>

            <div className="pt-2 flex flex-wrap justify-center gap-1.5">
              {user?.isSuperAdmin ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                  Super Administrator
                </Badge>
              ) : (
                user?.roles.map((r) => (
                  <Badge key={r} variant="outline" className="text-xs bg-muted/60">
                    {r}
                  </Badge>
                ))
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2 border-t text-xs">
            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Mail className="size-3.5" /> Email:
              </span>
              <span className="font-semibold text-foreground">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Building className="size-3.5" /> Department:
              </span>
              <span className="font-semibold text-foreground">
                {user?.department?.name || "Unassigned"} ({user?.department?.code || "—"})
              </span>
            </div>

            {user?.phone && (
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="size-3.5" /> Contact:
                </span>
                <span className="font-semibold text-foreground">{user.phone}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shield className="size-3.5" /> Account Status:
              </span>
              <StatusBadge status={user?.status} size="sm" />
            </div>
          </CardContent>
        </Card>

        {/* Right Section: Tabs for Assets & Permissions */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="assets" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assets" className="gap-2 text-xs">
                <PackageCheck className="size-4" />
                <span>My Issued Assets ({myAssets.length})</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2 text-xs">
                <Shield className="size-4" />
                <span>Effective Permissions ({user?.permissions?.length || 0})</span>
              </TabsTrigger>
            </TabsList>

            {/* Issued Assets Tab */}
            <TabsContent value="assets" className="space-y-4">
              <Card className="shadow-2xs border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Currently Assigned Physical Inventory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Serialized equipment currently checked out to your faculty / personnel account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAssetsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : myAssets.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <PackageCheck className="size-8 mx-auto text-muted-foreground/60" />
                      <p className="text-xs font-medium text-muted-foreground">
                        You currently have no serialized inventory assigned to your account.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myAssets.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors text-xs gap-3"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="font-semibold text-foreground truncate">
                              {unit.inventoryItem?.name || "Asset"}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex gap-2 font-mono">
                              <span>Code: {unit.uniqueCode}</span>
                              {unit.serialNumber && <span>• SN: {unit.serialNumber}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={unit.status} size="sm" />
                            <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-[11px]">
                              <Link href={`/inventory-units/${unit.id}`}>
                                <QrCode className="size-3.5" />
                                <span>QR Code</span>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card className="shadow-2xs border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Effective System Capabilities
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Derived from assigned roles and user-specific grant/revoke overrides.
                      </CardDescription>
                    </div>

                    <Input
                      type="search"
                      placeholder="Filter permission codes..."
                      value={permissionFilter}
                      onChange={(e) => setPermissionFilter(e.target.value)}
                      className="text-xs h-8 sm:w-48 bg-background"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {user?.isSuperAdmin ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="size-4" /> Full System Bypass Active
                      </div>
                      <p className="text-[11px] text-amber-600 dark:text-amber-300">
                        As a Super Administrator, you are exempt from permission checks and possess unrestricted read/write/approval authority across all departmental modules.
                      </p>
                    </div>
                  ) : filteredPermissions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      No permissions match your filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                      {filteredPermissions.map((code) => (
                        <div
                          key={code}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 font-mono text-[11px]"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate text-foreground">{code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
