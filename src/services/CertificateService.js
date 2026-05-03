import { NotFoundError } from '../errors/baseErrors.js';
import AttendanceModel from '../models/Attendance.js';
import CertificateModel from '../models/CertificateModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import cloudinary from '../utils/libs/cloudinary/index.js';
// path not needed

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

  // Support querying by multiple leagueMembership ids passed as an array
  if (Array.isArray(dbFilters.leagueMembership)) {
    dbFilters.leagueMembership = { $in: dbFilters.leagueMembership };
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

  // populate membership with user and university info
  const membership = await LeagueMembershipModel.findById(
    inputData.leagueMembership,
  )
    .populate('user', 'name email image')
    .populate('academicLeague', 'name university')
    .populate('squad', 'name')
    .populate('university', 'name logo')
    .lean()
    .exec();

  if (!membership) throw new NotFoundError('League membership not found');

  // If pdfUrl provided, just create; otherwise generate PDF, upload, and set pdfUrl
  let pdfUrl = inputData.pdfUrl;
  if (!pdfUrl) {
    // generate pdf buffer
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const endPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // header: university logo
    if (membership.university?.logo?.url) {
      try {
        const res = await axios.get(membership.university.logo.url, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });
        const imgBuf = Buffer.from(res.data);
        doc.image(imgBuf, 48, 48, { width: 100, height: 100 });
      } catch {
        // ignore image errors
      }
    }

    doc.fontSize(18).text('Certificado de Participação', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Emitido para: ${membership.user?.name || '---'}`, {
      align: 'left',
    });
    doc.moveDown(0.5);

    const roleLine = `Função: ${membership.role || '---'}`;
    const squadLine = membership.squad
      ? ` | Equipe: ${membership.squad.name || membership.squad}`
      : '';
    const leagueLine = membership.academicLeague
      ? `Liga: ${membership.academicLeague.name || membership.academicLeague}`
      : '';

    doc.fontSize(12).text(`${roleLine}${squadLine}`);
    if (leagueLine) doc.text(leagueLine);

    doc.moveDown();
    doc.fontSize(12).text(`Horas: ${inputData.workLoadHours} horas`);
    doc.text(
      `Data de emissão: ${new Date(inputData.issueDate).toLocaleDateString('pt-BR')}`,
    );

    doc.moveDown(1.5);
    const paragraph = `Este documento certifica que ${membership.user?.name || '---'} cumpriu as atividades vinculadas à sua participação na ${membership.academicLeague?.name || membership.university?.name || 'instituição'}, totalizando ${inputData.workLoadHours} horas.`;
    doc.fontSize(11).text(paragraph, { align: 'justify' });

    doc.moveDown(2);
    doc.text('______________________________', { align: 'right' });
    doc.text('Assinatura', { align: 'right' });

    doc.end();

    const pdfBuffer = await endPromise;

    const fileName = `${inputData.leagueMembership}-${Date.now()}.pdf`;
    const publicId = `certificates/${inputData.leagueMembership}-${Date.now()}`;

    const { url } = await cloudinary.uploadFile({
      fileBuffer: pdfBuffer,
      fileName,
      publicId,
      resourceType: 'raw',
    });

    pdfUrl = url;
  }

  return (
    await CertificateModel.create({
      ...inputData,
      pdfUrl,
    })
  ).toObject();
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
