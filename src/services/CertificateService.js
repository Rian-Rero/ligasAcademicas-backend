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
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 42,
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const endPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 42;
    const accent = '#8C6B2F';
    const dark = '#2F2418';
    const soft = '#F7F2E8';

    doc.save();
    doc.rect(0, 0, pageWidth, pageHeight).fill(soft);
    doc.restore();

    doc.save();
    doc.lineWidth(1.2).strokeColor(accent);
    doc
      .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      .stroke();
    doc.lineWidth(0.5).strokeColor('#D8C7A5');
    doc
      .rect(
        margin + 8,
        margin + 8,
        pageWidth - (margin + 8) * 2,
        pageHeight - (margin + 8) * 2,
      )
      .stroke();
    doc.restore();

    doc.save();
    doc
      .fillColor(accent)
      .opacity(0.16)
      .ellipse(pageWidth / 2, pageHeight / 2, 170, 110)
      .fill();
    doc.restore();

    // header: university logo
    if (membership.university?.logo?.url) {
      try {
        const res = await axios.get(membership.university.logo.url, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });
        const imgBuf = Buffer.from(res.data);
        doc.image(imgBuf, pageWidth / 2 - 34, margin + 4, { fit: [68, 68] });
      } catch {
        // ignore image errors
      }
    }

    const titleY = membership.university?.logo?.url ? margin + 92 : margin + 34;
    doc.fillColor(dark).font('Times-Bold').fontSize(28);
    doc.text('Certificado de Participação', 0, titleY, {
      align: 'center',
      width: pageWidth,
    });

    const titleLineY = titleY + 36;
    doc.save();
    doc.lineWidth(1).strokeColor(accent);
    doc
      .moveTo(pageWidth * 0.22, titleLineY)
      .lineTo(pageWidth * 0.78, titleLineY)
      .stroke();
    doc.restore();

    doc.fillColor(dark).font('Times-Italic').fontSize(15);
    doc.text('Certificamos que', 0, titleLineY + 18, {
      align: 'center',
      width: pageWidth,
    });

    const certificateName = membership.user?.name || '---';
    doc.fillColor(dark).font('Times-Bold').fontSize(30);
    doc.text(certificateName, 0, titleLineY + 44, {
      align: 'center',
      width: pageWidth,
    });

    const nameBlockHeight = doc.heightOfString(certificateName, {
      width: pageWidth,
      align: 'center',
    });
    const nameLineY = titleLineY + 44 + nameBlockHeight + 8;
    doc.save();
    doc.lineWidth(0.9).strokeColor(accent);
    doc
      .moveTo(pageWidth * 0.18, nameLineY)
      .lineTo(pageWidth * 0.82, nameLineY)
      .stroke();
    doc.restore();

    doc.fillColor(dark).font('Times-Roman').fontSize(14);
    doc.text(
      `recebeu este certificado por sua participação na ${membership.academicLeague?.name || membership.university?.name || 'instituição'}.`,
      pageWidth * 0.16,
      nameLineY + 18,
      {
        align: 'center',
        width: pageWidth * 0.68,
      },
    );

    const infoY = pageHeight - 128;
    const columnWidth = 166;
    const gap = 18;
    const totalWidth = columnWidth * 3 + gap * 2;
    const startX = (pageWidth - totalWidth) / 2;

    const infoCards = [
      {
        label: 'Função',
        value: membership.role || '---',
      },
      {
        label: 'Equipe',
        value: membership.squad?.name || '---',
      },
      {
        label: 'Horas',
        value: `${inputData.workLoadHours} horas`,
      },
    ];

    infoCards.forEach((card, index) => {
      const x = startX + index * (columnWidth + gap);
      doc.save();
      doc
        .roundedRect(x, infoY, columnWidth, 54, 8)
        .fillAndStroke('#FFFDF8', '#D8C7A5');
      doc.restore();
      doc
        .fillColor(accent)
        .font('Times-Bold')
        .fontSize(10)
        .text(card.label.toUpperCase(), x, infoY + 10, {
          align: 'center',
          width: columnWidth,
        });
      doc
        .fillColor(dark)
        .font('Times-Bold')
        .fontSize(14)
        .text(card.value, x, infoY + 25, {
          align: 'center',
          width: columnWidth,
        });
    });

    const issueDate = new Date(inputData.issueDate).toLocaleDateString('pt-BR');
    doc
      .fillColor(dark)
      .font('Times-Italic')
      .fontSize(12)
      .text(`Data de emissão: ${issueDate}`, margin + 18, pageHeight - 66, {
        align: 'left',
        width: 230,
      });

    const signatureX = pageWidth - margin - 250;
    doc.save();
    doc.lineWidth(0.8).strokeColor(accent);
    doc
      .moveTo(signatureX, pageHeight - 78)
      .lineTo(signatureX + 200, pageHeight - 78)
      .stroke();
    doc.restore();
    doc
      .fillColor(dark)
      .font('Times-Roman')
      .fontSize(12)
      .text('Assinatura', signatureX, pageHeight - 66, {
        align: 'center',
        width: 200,
      });

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
