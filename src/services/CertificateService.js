import { NotFoundError } from '../errors/baseErrors.js';
import AttendanceModel from '../models/Attendance.js';
import CertificateModel from '../models/CertificateModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';

async function validateLeagueMembershipExists(leagueMembership) {
  const foundLeagueMembership = await LeagueMembershipModel.exists({
    _id: leagueMembership,
  }).exec();

  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');
}

export async function get(inputFilters) {
  const {
    issueDateFrom,
    issueDateTo,
    minWorkLoadHours,
    maxWorkLoadHours,
    ...dbFilters
  } = inputFilters;

  if (issueDateFrom || issueDateTo) {
    dbFilters.issueDate = {
      ...(issueDateFrom && { $gte: issueDateFrom }),
      ...(issueDateTo && { $lte: issueDateTo }),
    };
  }

  if (minWorkLoadHours !== undefined || maxWorkLoadHours !== undefined) {
    dbFilters.workLoadHours = {
      ...(minWorkLoadHours !== undefined && { $gte: minWorkLoadHours }),
      ...(maxWorkLoadHours !== undefined && { $lte: maxWorkLoadHours }),
    };
  }

  return CertificateModel.find(dbFilters).sort({ issueDate: -1 }).lean().exec();
}

export async function getById(_id) {
  const foundCertificate = await CertificateModel.findById(_id).lean().exec();
  if (!foundCertificate) throw new NotFoundError('Certificate not found');

  return foundCertificate;
}

export async function create(inputData) {
  await validateLeagueMembershipExists(inputData.leagueMembership);

  return (await CertificateModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundCertificate = await CertificateModel.findById(_id).exec();
  if (!foundCertificate) throw new NotFoundError('Certificate not found');

  const nextLeagueMembership =
    inputData.leagueMembership ?? foundCertificate.leagueMembership;
  await validateLeagueMembershipExists(nextLeagueMembership);

  return foundCertificate.set(inputData).save();
}

export async function destroy(_id) {
  const foundCertificate = await CertificateModel.findById(_id).exec();
  if (!foundCertificate) throw new NotFoundError('Certificate not found');

  await foundCertificate.deleteOne();
}

export async function getLatestByLeagueMembership(leagueMembership) {
  await validateLeagueMembershipExists(leagueMembership);

  const foundCertificate = await CertificateModel.findOne({
    leagueMembership,
  })
    .sort({ issueDate: -1 })
    .lean()
    .exec();

  if (!foundCertificate)
    throw new NotFoundError('No certificate found for this league membership');

  return foundCertificate;
}

export async function getSummaryByLeagueMembership(leagueMembership) {
  await validateLeagueMembershipExists(leagueMembership);

  const [certificates, confirmedEvents, attendedEvents] = await Promise.all([
    CertificateModel.find({ leagueMembership })
      .select({ workLoadHours: 1 })
      .lean()
      .exec(),
    AttendanceModel.countDocuments({
      leagueMembership,
      isConfirmed: true,
    }).exec(),
    AttendanceModel.countDocuments({
      leagueMembership,
      hasAttended: true,
    }).exec(),
  ]);

  const totalWorkLoadHours = certificates.reduce(
    (hours, certificate) => hours + (certificate.workLoadHours ?? 0),
    0,
  );

  return {
    leagueMembership,
    certificatesIssued: certificates.length,
    totalWorkLoadHours,
    confirmedEvents,
    attendedEvents,
  };
}
