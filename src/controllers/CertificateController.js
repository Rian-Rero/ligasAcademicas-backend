import * as CertificateService from '../services/CertificateService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as CertificateValidator from '../validators/CertificateValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = CertificateValidator.get(req);
  const certificates = await CertificateService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(certificates);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = CertificateValidator.getById(req);
  const certificate = await CertificateService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(certificate);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = CertificateValidator.create(req);
  const newCertificate = await CertificateService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newCertificate);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = CertificateValidator.update(req);
  const updatedCertificate = await CertificateService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedCertificate);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = CertificateValidator.destroy(req);
  await CertificateService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const getLatestByLeagueMembership = asyncHandler(async (req, res) => {
  const { leagueMembership } =
    CertificateValidator.getLatestByLeagueMembership(req);
  const certificate =
    await CertificateService.getLatestByLeagueMembership(leagueMembership);

  res.status(SUCCESS_CODES.OK).json(certificate);
});

export const getSummaryByLeagueMembership = asyncHandler(async (req, res) => {
  const { leagueMembership } =
    CertificateValidator.getSummaryByLeagueMembership(req);
  const summary =
    await CertificateService.getSummaryByLeagueMembership(leagueMembership);

  res.status(SUCCESS_CODES.OK).json(summary);
});
