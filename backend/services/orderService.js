import mongoose from "mongoose";
import Product from "../models/Product.js";
import { ValidationError, ConflictError } from "../errors/CustomErrors.js";

const OWNER_STATUS_ORDER = ["pending", "approved", "prepared", "rented", "returned", "rejected"];
const PROCESSED_STATUS_ORDER = ["rented", "returned", "rejected"];
const FINALIZED_STATUS_ORDER = ["returned", "rejected"];

export const productOwnerMap = async (order) => {
  const productIdSet = new Set();
  for (const item of order.items) {
    const productIdStr =
      item?.product?._id?.toString() || item?.product?.toString();
    if (
      !productIdStr ||
      productIdStr === "undefined" ||
      productIdStr === "null"
    )
      throw new ValidationError("Product cannot be empty");
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      throw new ValidationError("Invalid product ID");
    }

    productIdSet.add(item.product?.toString());
  }
  if (!productIdSet.size) throw new ValidationError("Order cannot be empty");

  const productIdArray = [...productIdSet];
  const products = await Product.find({
    _id: { $in: productIdArray },
    isDeleted: false,
  }).select("_id owner");

  const productOwnerMap = {};
  for (const product of products) {
    if (!product?.owner?.toString()?.trim()) {
      console.warn(
        `Product ${product._id} has no owner or is not rentable/deleted`,
      );
      continue;
    }

    const ownerId = product.owner?._id
      ? product.owner._id.toString()
      : product.owner?.toString();
    productOwnerMap[product._id?.toString()] = ownerId;
  }

  return productOwnerMap;
};

export const createOwnersData = (order, ownersMapOld, ownersMap, _newAssignedStartDate, _newAssignedEndDate) => {
  const ownerDataMap = {}; // ownerId -> { finalStatus, hasChanged }

  for (const item of order.items) {
    const productId = item.product._id ? item.product._id.toString() : item.product.toString();

    const prevOwnerId = ownersMapOld[productId];
    const ownerId = ownersMap[productId];
    
    const prevOwnerData = order.ownersData?.find(ownerData => ownerData.owner.toString() === prevOwnerId);
    const currOwnerData = order.ownersData?.find(ownerData => ownerData.owner.toString() === ownerId);

    if (!ownerId) {
      throw new ConflictError(`Cannot order item without owner: object ${item._id} has no owner`);
    }

    const itemStatusIndex = OWNER_STATUS_ORDER.indexOf(item.status);

    if (!ownerDataMap[ownerId]) {
      ownerDataMap[ownerId] = {
        assignedStartDate: _newAssignedStartDate || prevOwnerData?.assignedStartDate || order.requestedStartDate,
        assignedEndDate: _newAssignedEndDate || prevOwnerData?.assignedEndDate || order.requestedEndDate,

        finalStatus: item.status,
        prevStatus: currOwnerData?.status || "pending",

        customerApproval: currOwnerData?.customerApproval ?? null,

        hasAssignedDates: !!((_newAssignedStartDate && _newAssignedEndDate) || (prevOwnerData?.assignedStartDate && prevOwnerData?.assignedEndDate)),
      };
      continue;
    }

    const ownerData = ownerDataMap[ownerId];

    if (item.status !== ownerData.finalStatus) {
      if (itemStatusIndex < OWNER_STATUS_ORDER.indexOf(ownerData.finalStatus)) {
        ownerData.finalStatus = item.status;
      }
    }
  }

  const ownerData = Object.entries(ownerDataMap).map(([owner, data]) => {
    const isStatusDecreased = OWNER_STATUS_ORDER.indexOf(data.finalStatus) < OWNER_STATUS_ORDER.indexOf(data.prevStatus);
    const isPrevOrderFinalized = FINALIZED_STATUS_ORDER.includes(data.prevStatus);
    const isPrevOrderProcessed = PROCESSED_STATUS_ORDER.includes(data.prevStatus);
    
    const assignedStartDate = data.assignedStartDate;
    const assignedEndDate = data.assignedEndDate;

    const customerApproval = data.customerApproval;

    if (isStatusDecreased) {
      if (data.finalStatus !== 'pending')
        throw new ConflictError("Cannot change item that has been proccessed.");

      if (isPrevOrderProcessed)
        throw new ConflictError("Cannot change owner: some of the pending orders with given item have to be processed first.");

      return { owner, assignedStartDate, assignedEndDate, status: 'changed', customerApproval };
    }

    if (data.finalStatus == 'pending' || (FINALIZED_STATUS_ORDER.includes(data.finalStatus) && !data.hasAssignedDates))
      return { owner, status: data.finalStatus, customerApproval };

    return { owner, assignedStartDate, assignedEndDate, status: data.finalStatus, customerApproval };
  });

  return ownerData;
};
