import { Router } from 'express';

import * as CertificateController from '../controllers/CertificateController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const CertificateRoutes = Router();

CertificateRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission('certificate.view'),
    CertificateController.get,
  )
  .post(
    verifyJWT,
    verifyPermission('certificate.create'),
    CertificateController.create,
  );

CertificateRoutes.get(
  '/league-membership/:leagueMembership/latest',
  verifyJWT,
  verifyPermission('certificate.view'),
  CertificateController.getLatestByLeagueMembership,
);
CertificateRoutes.get(
  '/league-membership/:leagueMembership/summary',
  verifyJWT,
  verifyPermission('certificate.view'),
  CertificateController.getSummaryByLeagueMembership,
);

CertificateRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission('certificate.view'),
    CertificateController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission('certificate.edit'),
    CertificateController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission('certificate.delete'),
    CertificateController.destroy,
  );

export default CertificateRoutes;
