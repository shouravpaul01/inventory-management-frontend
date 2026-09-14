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
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type TFulfillmentStatus =
  | "PENDING"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED";

export type TRequestLineStatus =
  | "PENDING"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED";

export type TRequisitionLine = {
  id: string;
  requisitionId?: string;
  inventoryItemId: string;
  itemId?: string;
  inventoryItem?: TInventoryItem;
  item?: TInventoryItem;
  requestedQty: number;
  approvedQty: number;
  issuedQty?: number;
  returnedQty?: number;
  status: TRequestLineStatus;
  requestedIssuePolicy?: TIssuePolicy;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TRequisitionItem = TRequisitionLine;

export type TApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type TApprovalRecord = {
  id: string;
  approvalRequestId?: string;
  stepNumber?: number;
  level: number;
  approverRoleId?: string | null;
  approverId?: string | null;
  approver?: TUser;
  status: TApprovalStatus;
  decision?: "APPROVE" | "REJECT" | "REQUEST_CHANGE" | null;
  comments?: string | null;
  decisionAt?: string | null;
  actedAt?: string | null;
  createdAt: string;
};

export type TApprovalRequest = {
  id: string;
  requestNumber?: string;
  entityType: string;
  entityId: string;
  permissionCode?: string;
  status: TApprovalStatus;
  currentStep?: number;
  currentLevel?: number;
  totalLevels?: number;
  reason?: string | null;
  metadata?: any;
  requestedById?: string;
  requestedBy?: TUser;
  records: TApprovalRecord[];
  createdAt: string;
  updatedAt: string;
};

export type TRequisition = {
  id: string;
  requestNumber: string;
  requisitionNo?: string;
  type?: "REQUISITION" | "ORDER";
  purpose: string;
  title?: string;
  issueMode?: TIssueMode;
  priority?: TRequisitionPriority;
  status: TRequisitionStatus;
  fulfillmentStatus?: TFulfillmentStatus;
  isTemporary: boolean;
  requiredFrom?: string | null;
  requiredUntil?: string | null;
  requesterId: string;
  requester?: TUser;
  departmentId: string;
  department?: TDepartment;
  lines: TRequisitionLine[];
  items?: TRequisitionLine[];
  approvalRequestId?: string | null;
  approvalRequest?: TApprovalRequest | null;
  remarks?: string | null;
  createdAt: string;
};

export type TRecipientType = "INDIVIDUAL" | "DEPARTMENT" | "EVENT" | "EXTERNAL_GUEST";
export type TDistributionStatus = "ISSUED" | "CONFIRMED" | "CANCELLED" | "DRAFT" | "DISPATCHED";
export type TDeliveryStatus = "PENDING" | "DELIVERED" | "RECEIVED" | "REJECTED" | "FAILED";

export type TDeliveryConfirmation = {
  id: string;
  distributionId: string;
  deliveryStatus: TDeliveryStatus;
  confirmedAt?: string | null;
  signatureUrl?: string | null;
  receiverRemarks?: string | null;
  deliveredById?: string | null;
  deliveredBy?: TUser | null;
  createdAt: string;
};

export type TDistributionLine = {
  id: string;
  distributionId?: string;
  requisitionLineId?: string | null;
  inventoryItemId: string;
  itemId?: string;
  inventoryItem?: TInventoryItem;
  item?: TInventoryItem;
  inventoryUnitId?: string | null;
  unitId?: string | null;
  inventoryUnit?: TInventoryUnit | null;
  unit?: TInventoryUnit | null;
  locationId?: string;
  quantity: number;
  issueMode?: "PERMANENT" | "TEMPORARY" | "GIFT";
  condition?: string;
  expectedReturnAt?: string | null;
  remarks?: string | null;
  createdAt?: string;
};

export type TDistributionItem = TDistributionLine;

export type TDistribution = {
  id: string;
  distributionNo: string;
  requisitionId: string;
  requisition?: TRequisition;
  issuedById?: string;
  issuedBy?: TUser;
  distributedById?: string;
  distributedBy?: TUser;
  receiverId: string;
  receiver?: TUser;
  recipientId?: string | null;
  recipient?: TUser | null;
  recipientName?: string | null;
  recipientType?: TRecipientType;
  departmentId?: string;
  department?: TDepartment;
  issueMode?: "PERMANENT" | "TEMPORARY" | "GIFT";
  status: TDistributionStatus;
  deliveryStatus?: TDeliveryStatus;
  handoverMethod?: "SELF_COLLECTION" | "DELIVERED_BY_STAFF" | "COURIER" | "OTHER";
  expectedReturnAt?: string | null;
  remarks?: string | null;
  deliveryNotes?: string | null;
  deliveryConfirmation?: TDeliveryConfirmation | null;
  confirmedAt?: string | null;
  signatureUrl?: string | null;
  lines: TDistributionLine[];
  items?: TDistributionLine[];
  createdAt: string;
  updatedAt?: string;
};

export type TReturnConditionType = "SAME" | "GOOD" | "DAMAGED" | "LOST" | "NEEDS_REPAIR";
export type TReturnTransactionStatus = "EXPECTED" | "PARTIALLY_RETURNED" | "RETURNED" | "OVERDUE" | "LOST";

export type TReturnItem = {
  id: string;
  returnTransactionId?: string;
  returnId?: string;
  inventoryItemId: string;
  itemId?: string;
  inventoryItem?: TInventoryItem;
  item?: TInventoryItem;
  inventoryUnitId?: string | null;
  unitId?: string | null;
  inventoryUnit?: TInventoryUnit | null;
  unit?: TInventoryUnit | null;
  destinationLocationId?: string;
  quantity: number;
  condition: TReturnConditionType;
  remarks?: string | null;
  createdAt?: string;
};

export type TReturnLine = TReturnItem;

export type TReturn = {
  id: string;
  returnNumber: string;
  returnNo?: string;
  distributionId: string;
  distribution?: TDistribution | null;
  requisitionId?: string | null;
  requisition?: TRequisition | null;
  status: TReturnTransactionStatus;
  processedById?: string;
  processedBy?: TUser;
  returnedById?: string;
  returnedBy?: TUser;
  destinationLocationId?: string | null;
  destinationLocation?: TStockLocation | null;
  lines: TReturnLine[];
  items?: TReturnLine[];
  remarks?: string | null;
  notes?: string | null;
  returnedAt?: string;
  createdAt: string;
  updatedAt?: string;
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
  beforeData?: any;
  afterData?: any;
  metadata?: any;
  approvalRequired?: boolean;
  approvalBypassed?: boolean;
  createdAt: string;
};

export type TNotificationType =
  | "SYSTEM"
  | "APPROVAL"
  | "REQUISITION"
  | "DISTRIBUTION"
  | "RETURN"
  | "DELIVERY"
  | "STOCK"
  | "ALERT"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "DANGER";

export type TNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: TNotificationType;
  isRead: boolean;
  referenceType?: string | null;
  referenceId?: string | null;
  link?: string | null;
  metadata?: any;
  createdAt: string;
};
