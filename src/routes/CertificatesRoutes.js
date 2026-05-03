import { Router } from 'express';

import * as CertificateController from '../controllers/CertificateController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const CertificateRoutes = Router();

CertificateRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission(permissions.certificate.view),
    CertificateController.get,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.certificate.create),
    CertificateController.create,
  );

CertificateRoutes.get(
  '/league-membership/:leagueMembership/latest',
  verifyJWT,
  verifyPermission(permissions.certificate.view),
  CertificateController.getLatestByLeagueMembership,
);
CertificateRoutes.get(
  '/league-membership/:leagueMembership/summary',
  verifyJWT,
  verifyPermission(permissions.certificate.view),
  CertificateController.getSummaryByLeagueMembership,
);

CertificateRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.certificate.view),
    CertificateController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.certificate.edit),
    CertificateController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.certificate.delete),
    CertificateController.destroy,
  );

export default CertificateRoutes;
