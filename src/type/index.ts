export type TValidatorError = {
  path: any;
  message: string;
};

export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type TApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: TMeta;
  data: T;
};

export type TPaginatedResponse<T> = {
  meta: TMeta;
  data: T[];
};

export type TTokenData = {
  id: string;
  employeeId?: string;
  username?: string;
  name?: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
  departmentId?: string | null;
  photo?: string;
  phone?: string;
};

// ==================== AUTH & USER TYPES ====================
export type TDepartment = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TPermission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TRolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  permission: TPermission;
};

export type TRole = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: TRolePermission[];
  createdAt: string;
  updatedAt: string;
};

export type TUserRole = {
  id: string;
  userId: string;
  roleId: string;
  role: TRole;
};

export type TUserPermission = {
  id: string;
  userId: string;
  permissionId: string;
  granted: boolean;
  permission: TPermission;
};

export type TUserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type TUser = {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  isSuperAdmin: boolean;
  status: TUserStatus;
  departmentId?: string | null;
  department?: TDepartment | null;
  roles?: TUserRole[] | string[];
  permissions?: TUserPermission[] | string[];
  createdAt: string;
  updatedAt: string;
};

export type TCurrentUser = {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  isSuperAdmin: boolean;
  status: TUserStatus;
  department?: TDepartment | null;
  departmentId?: string | null;
  roles: string[];
  permissions: string[];
  authInfo?: {
    lastLoginAt?: string | null;
    emailVerifiedAt?: string | null;
    passwordChangedAt?: string | null;
  } | null;
};

// ==================== INVENTORY TYPES ====================
export type TItemType = "CONSUMABLE" | "ASSET";
export type TUnitOfMeasure = "PCS" | "BOX" | "PACK" | "KG" | "LITER" | "METER" | "ROLL" | "SET";

export type TCategory = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parent?: TCategory | null;
  children?: TCategory[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TLocationType =
  | "CENTRAL_STORE"
  | "DEPARTMENT_STORE"
  | "ROOM"
  | "SHELF"
  | "CUPBOARD"
  | "BIN";

export type TBuilding = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  floors?: TFloor[];
  createdAt: string;
  updatedAt: string;
};

export type TFloor = {
  id: string;
  buildingId: string;
  building?: TBuilding;
  name: string;
  code: string;
  floorNumber?: number | null;
  imageUrl?: string | null;
  rooms?: TRoom[];
  createdAt: string;
  updatedAt: string;
};

export type TRoomType = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TRoom = {
  id: string;
  floorId: string;
  floor?: TFloor;
  roomTypeId?: string | null;
  roomType?: TRoomType | null;
  name: string;
  code: string;
  capacity?: number | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  imageUrl?: string | null;
  stockLocations?: TStockLocation[];
  createdAt: string;
  updatedAt: string;
};

export type TStockLocationType =
  | "STORE"
  | "ROOM"
  | "RACK"
  | "SHELF"
  | "CABINET"
  | "OTHER";

export type TStockLocation = {
  id: string;
  name: string;
  code: string;
  type: TStockLocationType;
  description?: string | null;
  buildingId?: string | null;
  building?: TBuilding | null;
  floorId?: string | null;
  floor?: TFloor | null;
  roomId?: string | null;
  room?: TRoom | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TLocation = TStockLocation;

export type TTrackingType = "SERIALIZED" | "BULK";
export type TIssuePolicy = "PERMANENT" | "TEMPORARY" | "GIFT";

export type TInventoryItem = {
  id: string;
  name: string;
  code: string;
  itemCode?: string;
  sku?: string | null;
  description?: string | null;
  categoryId: string;
  category?: TCategory;
  brand?: string | null;
  model?: string | null;
  trackingType: TTrackingType;
  isReturnable: boolean;
  defaultIssuePolicy: TIssuePolicy;
  unitName: string;
  minimumStock: number;
  reorderLevel: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isActive: boolean;
  stockBalances?: TStockBalance[];
  units?: TInventoryUnit[];
  totalStock?: number;
  availableStock?: number;
  createdAt: string;
  updatedAt: string;
};

export type TUnitStatus =
  | "AVAILABLE"
  | "ALLOCATED"
  | "RESERVED"
  | "ISSUED"
  | "MAINTENANCE"
  | "UNDER_REPAIR"
  | "DAMAGED"
  | "DISPOSED"
  | "LOST";

export type TUnitCondition = "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export type TInventoryUnit = {
  id: string;
  uniqueCode: string;
  unitBarcode?: string;
  barcode?: string | null;
  serialNumber?: string | null;
  status: TUnitStatus;
  condition: TUnitCondition;
  inventoryItemId: string;
  inventoryItem?: TInventoryItem;
  locationId?: string | null;
  location?: TStockLocation | null;
  departmentId?: string | null;
  department?: TDepartment | null;
  purchaseDate?: string | null;
  warrantyEndDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TStockBalance = {
  id: string;
  inventoryItemId: string;
  itemId?: string;
  inventoryItem?: TInventoryItem;
  item?: TInventoryItem;
  locationId: string;
  location?: TStockLocation;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minReorderLevel?: number;
  maxReorderLevel?: number | null;
  lastRestockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TStockMovementType =
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

export type TStockMovementPhoto = {
  id: string;
  imageUrl: string;
  imagePublicId?: string;
  caption?: string | null;
};

export type TStockMovement = {
  id: string;
  movementNumber: string;
  type: TStockMovementType;
  quantity: number;
  inventoryItemId: string;
  inventoryItem?: TInventoryItem;
  inventoryUnitId?: string | null;
  inventoryUnit?: TInventoryUnit | null;
  fromLocationId?: string | null;
  fromLocation?: TStockLocation | null;
  toLocationId?: string | null;
  toLocation?: TStockLocation | null;
  performedById?: string;
  performedBy?: TUser | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  photos?: TStockMovementPhoto[];
  createdAt: string;
  updatedAt?: string;
};

export type TStockTransactionType = TStockMovementType;
export type TStockLedger = TStockMovement;

// ==================== WORKFLOW TYPES ====================
export type TIssueMode =
  | "CONSUMABLE_DISBURSEMENT"
  | "ASSET_ISSUANCE"
  | "GIFT"
  | "DEPARTMENT_TRANSFER";

export type TRequisitionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type TRequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED";

export type TRequisitionItem = {
  id: string;
  requisitionId: string;
  itemId: string;
  item?: TInventoryItem;
  requestedQty: number;
  approvedQty?: number | null;
  distributedQty: number;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type TApprovalRecord = {
  id: string;
  stepNumber: number;
  approverId: string;
  approver?: TUser;
  status: TApprovalStatus;
  comments?: string | null;
  decisionAt?: string | null;
  createdAt: string;
};

export type TApprovalRequest = {
  id: string;
  entityType: string;
  entityId: string;
  status: TApprovalStatus;
  currentStep: number;
  records: TApprovalRecord[];
  createdAt: string;
  updatedAt: string;
};

export type TRequisition = {
  id: string;
  requisitionNo: string;
  title: string;
  purpose: string;
  issueMode: TIssueMode;
  priority: TRequisitionPriority;
  status: TRequisitionStatus;
  requesterId: string;
  requester?: TUser;
  departmentId: string;
  department?: TDepartment;
  items: TRequisitionItem[];
  approvalRequestId?: string | null;
  approvalRequest?: TApprovalRequest | null;
  remarks?: string | null;
  requiredDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TRecipientType = "INDIVIDUAL" | "DEPARTMENT" | "EVENT" | "EXTERNAL_GUEST";
export type TDistributionStatus = "DRAFT" | "DISPATCHED" | "CONFIRMED" | "CANCELLED";

export type TDistributionItem = {
  id: string;
  distributionId: string;
  itemId: string;
  item?: TInventoryItem;
  unitId?: string | null;
  unit?: TInventoryUnit | null;
  quantity: number;
  remarks?: string | null;
  createdAt: string;
};

export type TDistribution = {
  id: string;
  distributionNo: string;
  requisitionId: string;
  requisition?: TRequisition;
  recipientId?: string | null;
  recipient?: TUser | null;
  recipientName?: string | null;
  recipientType: TRecipientType;
  departmentId: string;
  department?: TDepartment;
  distributedById: string;
  distributedBy?: TUser;
  status: TDistributionStatus;
  disbursedAt: string;
  deliveryNotes?: string | null;
  confirmedAt?: string | null;
  confirmationMethod?: string | null;
  signatureUrl?: string | null;
  items: TDistributionItem[];
  createdAt: string;
  updatedAt: string;
};

export type TReturnType = "DAMAGED" | "EXCESS" | "MAINTENANCE" | "PERMANENT";
export type TReturnStatus = "REQUESTED" | "UNDER_INSPECTION" | "ACCEPTED" | "REJECTED";

export type TReturnItem = {
  id: string;
  returnId: string;
  itemId: string;
  item?: TInventoryItem;
  unitId?: string | null;
  unit?: TInventoryUnit | null;
  quantity: number;
  condition: TUnitCondition;
  reason: string;
  actionTaken?: string | null;
  createdAt: string;
};

export type TReturn = {
  id: string;
  returnNo: string;
  distributionId?: string | null;
  distribution?: TDistribution | null;
  requisitionId?: string | null;
  requisition?: TRequisition | null;
  returnType: TReturnType;
  status: TReturnStatus;
  returnedById: string;
  returnedBy?: TUser;
  destinationLocationId?: string | null;
  destinationLocation?: TLocation | null;
  items: TReturnItem[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

// ==================== SYSTEM TYPES ====================
export type TAuditLog = {
  id: string;
  action: string;
  module: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actor?: TUser | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
  createdAt: string;
};

export type TNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  isRead: boolean;
  link?: string | null;
  metadata?: any;
  createdAt: string;
};
