import {
  createReservation,
  listMyReservations,
  cancelReservation,
  listStoreReservations,
  findStoreReservationByCode,
  collectStoreReservation,
} from "../services/reservations.service.js";
import { validateReservationCreate, reservationIdField, reservationCodeField } from "../utils/validateReservation.js";
import { uuidField } from "../utils/validateInventory.js";

// Consumer -------------------------------------------------------------------

export async function postReservation(req, res) {
  const data = await createReservation({
    userId: req.user.id,
    payload: validateReservationCreate(req.body),
  });
  res.status(201).json({ success: true, data });
}

export async function getMyReservations(req, res) {
  const data = await listMyReservations({ userId: req.user.id });
  res.status(200).json({ success: true, data });
}

export async function postCancelReservation(req, res) {
  const data = await cancelReservation({
    userId: req.user.id,
    reservationId: reservationIdField(req.params.id),
  });
  res.status(200).json({ success: true, data });
}

// Store Portal -----------------------------------------------------------------

const optionalStoreId = (req) => uuidField(req.query.store_id, "Store", { required: false });

export async function getStoreReservations(req, res) {
  const { store, reservations } = await listStoreReservations({
    userId: req.user.id,
    storeId: optionalStoreId(req),
  });
  res.status(200).json({ success: true, data: reservations, meta: { store_id: store.id } });
}

export async function getStoreReservationByCode(req, res) {
  const data = await findStoreReservationByCode({
    userId: req.user.id,
    storeId: optionalStoreId(req),
    code: reservationCodeField(req.query.code),
  });
  res.status(200).json({ success: true, data });
}

export async function postCollectReservation(req, res) {
  const data = await collectStoreReservation({
    userId: req.user.id,
    storeId: optionalStoreId(req),
    reservationId: reservationIdField(req.params.id),
  });
  res.status(200).json({ success: true, data });
}
