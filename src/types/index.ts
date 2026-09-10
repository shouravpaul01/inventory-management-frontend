// ============================================================
// UNIVERSITY INVENTORY MANAGEMENT SYSTEM - CORE DOMAIN TYPES
// ============================================================

// ------------------------------------------------------------
// API RESPONSE CONTRACT
// ------------------------------------------------------------
export interface ApiResponse<T = any> {
  statusCode?: number;
  success: boolean;
  message: string;
  meta?: ApiMeta;
  data: T;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  success: false;
  message: string;
  errorSources?: Array<{ path: string | number; message: string }>;
  error?: any;
}

// ------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type PermissionEffect = "GRANT" | "REVOKE";

export type ApprovalRequirement = "REQUIRED" | "NOT_REQUIRED";
export type ApprovalScope = "SYSTEM" | "ROLE" | "USER";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalDecision = "APPROVED" | "REJECTED" | "RETURN_FOR_CORRECTION";

export type ApprovalEntityType =
  | "USER"
  | "ROLE"
  | "DEPARTMENT"
  | "BUILDING"
  | "FLOOR"
  | "ROOM"
  | "ROOM_TYPE"
  | "STOCK_LOCATION"
  | "CATEGORY"
  | "INVENTORY_ITEM"
  | "INVENTORY_UNIT"
  | "STOCK_ADJUSTMENT"
  | "STOCK_TRANSFER"
  | "REQUISITION"
  | "DISTRIBUTION"
  | "RETURN"
  | "DELIVERY"
  | "CODE_SEQUENCE"
  | "OTHER";

export type RoomStatus = "ACTIVE" | "INACTIVE";

export type StockTrackingType = "SERIALIZED" | "BULK";
export type IssuePolicy = "PERMANENT" | "TEMPORARY" | "GIFT";

export type InventoryUnitStatus =
  | "IN_STOCK"
  | "RESERVED"
  | "ISSUED"
  | "RETURN_PENDING"
  | "RETURNED"
  | "DAMAGED"
  | "LOST"
  | "DISPOSED"
  | "GIFTED"
  | "MAINTENANCE";

export type ConditionStatus =
  | "NEW"
  | "GOOD"
  | "FAIR"
  | "DAMAGED"
  | "LOST"
  | "DISPOSED";

export type RequestType = "REQUISITION" | "ORDER";

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED"
  | "CLOSED";

export type RequestLineStatus =
  | "PENDING"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "PARTIALLY_ISSUED"
  | "ISSUED"
  | "CLOSED";

export type FulfillmentStatus =
  | "PENDING"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";

export type IssueMode = "PERMANENT" | "TEMPORARY" | "GIFT";

export type HandoverMethod =
  | "SELF_COLLECTION"
  | "DELIVERED_BY_STAFF"
  | "COURIER"
  | "OTHER";

export type DeliveryStatus =
  | "PENDING"
  | "DELIVERED"
  | "RECEIVED"
  | "REJECTED"
  | "FAILED";

export type ReturnStatus =
  | "NOT_REQUIRED"
  | "EXPECTED"
  | "PARTIALLY_RETURNED"
  | "RETURNED"
  | "OVERDUE"
  | "LOST"
  | "CANCELLED";

export type ReturnCondition =
  | "SAME"
  | "GOOD"
  | "DAMAGED"
  | "LOST"
  | "NEEDS_REPAIR";

export type StockMovementType =
  | "PURCHASE"
  | "INITIAL_STOCK"
  | "STOCK_IN"
  | "STOCK_OUT"
  | "TRANSFER"
  | "DISTRIBUTION"
  | "RETURN"
  | "RESERVATION"
  | "RESERVATION_RELEASE"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "LOSS"
  | "DISPOSAL"
  | "GIFT";

export type LocationType =
  | "BUILDING"
  | "FLOOR"
  | "ROOM"
  | "STORE"
  | "WAREHOUSE"
  | "SHELF"
  | "RACK"
  | "CABINET"
  | "OTHER";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "ACCOUNT_LOCK"
  | "ACCOUNT_UNLOCK"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "DISTRIBUTE"
  | "RETURN"
  | "TRANSFER"
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUST"
  | "EXPORT"
  | "IMPORT";

export type NotificationType =
  | "SYSTEM"
  | "APPROVAL"
  | "REQUISITION"
  | "DISTRIBUTION"
  | "RETURN"
  | "DELIVERY"
  | "STOCK"
  | "ALERT";

// ------------------------------------------------------------
// USER & AUTH
// ------------------------------------------------------------
export interface IDepartment {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users?: number;
  };
}

export interface IUser {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  status: UserStatus;
  isSuperAdmin: boolean;
  departmentId: string;
  department?: IDepartment;
  roles?: Array<{
    id: string;
    roleId: string;
    role: IRole;
  }>;
  permissions?: Array<{
    id: string;
    permissionId: string;
    effect: PermissionEffect;
    permission: IPermission;
  }>;
  effectivePermissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAuthUser {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  isSuperAdmin: boolean;
  status: UserStatus;
  departmentId?: string;
  department?: IDepartment;
  roles: string[];
  permissions: string[];
}

export interface TTokenData {
  id: string;
  employeeId?: string;
  username?: string;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
  photo?: string;
  phone?: string;
}

// ------------------------------------------------------------
// RBAC
// ------------------------------------------------------------
export interface IPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IRole {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystemRole: boolean;
  permissions?: Array<{
    id: string;
    permissionId: string;
    permission: IPermission;
  }>;
  _count?: {
    users?: number;
    permissions?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IUserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  effect: PermissionEffect;
  permission: IPermission;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// APPROVAL POLICY & REQUEST
// ------------------------------------------------------------
export interface IConditionRule {
  field: string;
  operator: string;
  value: any;
}

export interface IConditionGroup {
  operator?: "AND" | "OR";
  conditions?: (IConditionRule | IConditionGroup)[];
  rules?: (IConditionRule | IConditionGroup)[];
}

export interface IApprovalPolicy {
  id: string;
  permissionId: string;
  permission?: IPermission;
  requirement: ApprovalRequirement;
  scope: ApprovalScope;
  roleId?: string | null;
  role?: IRole | null;
  userId?: string | null;
  user?: IUser | null;
  condition?: any;
  approvalLevels: number;
  allowSelfApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IApprovalRequest {
  id: string;
  code: string;
  permissionCode: string;
  entityType: ApprovalEntityType;
  entityId?: string | null;
  status: ApprovalStatus;
  currentLevel: number;
  totalLevels: number;
  requestedById: string;
  requestedBy?: IUser;
  payloadSnapshot?: any;
  records?: IApprovalRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface IApprovalRecord {
  id: string;
  requestId: string;
  level: number;
  status: ApprovalStatus;
  decision?: ApprovalDecision | null;
  approverId?: string | null;
  approver?: IUser | null;
  approverRoleId?: string | null;
  approverRole?: IRole | null;
  comments?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// LOCATION HIERARCHY
// ------------------------------------------------------------
export interface IBuilding {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  floors?: IFloor[];
  _count?: {
    floors?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IFloor {
  id: string;
  buildingId: string;
  building?: IBuilding;
  floorNumber: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  rooms?: IRoom[];
  _count?: {
    rooms?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IRoomType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms?: number;
  };
}

export interface IRoom {
  id: string;
  buildingId: string;
  building?: IBuilding;
  floorId: string;
  floor?: IFloor;
  roomTypeId: string;
  roomType?: IRoomType;
  code: string;
  name: string;
  status: RoomStatus;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  stockLocations?: IStockLocation[];
  _count?: {
    stockLocations?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IStockLocation {
  id: string;
  roomId: string;
  room?: IRoom;
  code: string;
  name: string;
  type: LocationType;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    stockBalances?: number;
    inventoryUnits?: number;
  };
}

// ------------------------------------------------------------
// INVENTORY CATEGORY & ITEMS
// ------------------------------------------------------------
export interface ICategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parent?: ICategory | null;
  children?: ICategory[];
  _count?: {
    items?: number;
    children?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICodeSequence {
  id: string;
  name: string;
  code: string;
  prefix: string;
  separator?: string;
  padding: number;
  startNumber: number;
  currentNumber: number;
  includeYear: boolean;
  includeMonth: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryItem {
  id: string;
  name: string;
  code: string;
  sku?: string | null;
  description?: string | null;
  categoryId: string;
  category?: ICategory;
  brand?: string | null;
  model?: string | null;
  trackingType: StockTrackingType;
  isReturnable: boolean;
  defaultIssuePolicy: IssuePolicy;
  unitName: string;
  minimumStock: number;
  reorderLevel: number;
  isActive: boolean;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  stockBalances?: IStockBalance[];
  _count?: {
    units?: number;
    stockBalances?: number;
    requisitionLines?: number;
  };
  unitStats?: {
    total: number;
    inStock: number;
    reserved: number;
    issued: number;
    damaged: number;
    lost: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryUnit {
  id: string;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  uniqueCode: string;
  serialNumber?: string | null;
  barcode?: string | null;
  qrValue: string;
  status: InventoryUnitStatus;
  condition: ConditionStatus;
  currentLocationId: string;
  currentLocation?: IStockLocation;
  currentHolderId?: string | null;
  currentHolder?: IUser | null;
  purchaseDate?: string | null;
  warrantyEndDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// STOCK BALANCES & MOVEMENTS
// ------------------------------------------------------------
export interface IStockBalance {
  id: string;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  locationId: string;
  location?: IStockLocation;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  updatedAt: string;
}

export interface IStockMovementPhoto {
  id: string;
  movementId: string;
  photoUrl: string;
  publicId?: string | null;
  caption?: string | null;
  createdAt: string;
}

export interface IStockMovement {
  id: string;
  code: string;
  type: StockMovementType;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  inventoryUnitId?: string | null;
  inventoryUnit?: IInventoryUnit | null;
  quantity: number;
  fromLocationId?: string | null;
  fromLocation?: IStockLocation | null;
  toLocationId?: string | null;
  toLocation?: IStockLocation | null;
  performedById: string;
  performedBy?: IUser;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  photos?: IStockMovementPhoto[];
  createdAt: string;
}

// ------------------------------------------------------------
// REQUISITION
// ------------------------------------------------------------
export interface IRequisitionLine {
  id: string;
  requisitionId: string;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  requestedQty: number;
  approvedQty?: number;
  issuedQty?: number;
  returnedQty?: number;
  requestedIssuePolicy?: IssuePolicy;
  status: RequestLineStatus;
  remarks?: string | null;
}

export interface IRequisition {
  id: string;
  code: string;
  type: RequestType;
  departmentId: string;
  department?: IDepartment;
  requesterId: string;
  requester?: IUser;
  purpose: string;
  status: RequestStatus;
  fulfillmentStatus: FulfillmentStatus;
  isTemporary: boolean;
  requiredFrom?: string | null;
  requiredUntil?: string | null;
  remarks?: string | null;
  lines: IRequisitionLine[];
  approvalRequestId?: string | null;
  approvalRequest?: IApprovalRequest | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// DISTRIBUTION & DELIVERY
// ------------------------------------------------------------
export interface IDeliveryConfirmation {
  id: string;
  distributionId: string;
  deliveryStatus: DeliveryStatus;
  deliveredById?: string | null;
  deliveredBy?: IUser | null;
  receivedById?: string | null;
  receivedBy?: IUser | null;
  receivedAt?: string | null;
  receiverRemarks?: string | null;
  signatureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDistributionLine {
  id: string;
  distributionId: string;
  requisitionLineId?: string | null;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  inventoryUnitId?: string | null;
  inventoryUnit?: IInventoryUnit | null;
  locationId: string;
  location?: IStockLocation;
  quantity: number;
  issueMode: IssueMode;
  condition: ConditionStatus;
  expectedReturnAt?: string | null;
  returnedQty: number;
  remarks?: string | null;
}

export interface IDistribution {
  id: string;
  code: string;
  requisitionId: string;
  requisition?: IRequisition;
  issuedById: string;
  issuedBy?: IUser;
  receiverId: string;
  receiver?: IUser;
  issueMode: IssueMode;
  handoverMethod: HandoverMethod;
  expectedReturnAt?: string | null;
  remarks?: string | null;
  lines: IDistributionLine[];
  deliveryConfirmation?: IDeliveryConfirmation | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// RETURN WORKFLOW
// ------------------------------------------------------------
export interface IReturnLineItem {
  id: string;
  returnTransactionId: string;
  inventoryItemId: string;
  inventoryItem?: IInventoryItem;
  inventoryUnitId?: string | null;
  inventoryUnit?: IInventoryUnit | null;
  destinationLocationId: string;
  destinationLocation?: IStockLocation;
  quantity: number;
  condition: ReturnCondition;
  remarks?: string | null;
}

export interface IReturnLocationSplit {
  locationId: string;
  location?: IStockLocation;
  quantity: number;
}

export interface IReturnTransaction {
  id: string;
  code: string;
  distributionId: string;
  distribution?: IDistribution;
  returnedById: string;
  returnedBy?: IUser;
  processedById: string;
  processedBy?: IUser;
  status: ReturnStatus;
  remarks?: string | null;
  lines: IReturnLineItem[];
  evidencePhotos?: Array<{
    id: string;
    photoUrl: string;
    caption?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// AUDIT LOG
// ------------------------------------------------------------
export interface IAuditLog {
  id: string;
  action: AuditAction;
  module: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actor?: IUser | null;
  approvalRequestId?: string | null;
  wasApprovalRequired: boolean;
  wasBypassed: boolean;
  bypassReason?: string | null;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  diff?: any;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// ------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  linkUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  createdAt: string;
}

// ------------------------------------------------------------
// REPORTS & DASHBOARD
// ------------------------------------------------------------
export interface IDashboardStats {
  totalItems: number;
  totalSerializedUnits: number;
  totalBulkStock: number;
  activeUsers: number;
  pendingRequisitions: number;
  pendingApprovals: number;
  issuedItems: number;
  dueReturns: number;
  overdueReturns: number;
  lowStockItemsCount: number;
  recentMovements: IStockMovement[];
  recentDistributions: IDistribution[];
}

export interface ILowStockItem {
  id: string;
  name: string;
  code: string;
  sku?: string | null;
  unitName: string;
  minimumStock: number;
  reorderLevel: number;
  currentStock: number;
  deficit: number;
  trackingType: StockTrackingType;
  category?: {
    id: string;
    name: string;
  };
}

export interface IOverdueReturnItem {
  distributionId: string;
  distributionCode: string;
  receiver: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    employeeId: string;
    phone?: string | null;
  };
  item: {
    id: string;
    name: string;
    code: string;
  };
  unit?: {
    id: string;
    uniqueCode: string;
    serialNumber?: string | null;
  } | null;
  quantity: number;
  expectedReturnAt: string;
  daysOverdue: number;
}
