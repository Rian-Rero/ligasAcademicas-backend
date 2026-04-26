import { Router } from 'express';

import * as CertificateController from '../controllers/CertificateController.js';

const CertificateRoutes = Router();

CertificateRoutes.route('/')
  .get(CertificateController.get)
  .post(CertificateController.create);

CertificateRoutes.get(
  '/league-membership/:leagueMembership/latest',
  CertificateController.getLatestByLeagueMembership,
);
CertificateRoutes.get(
  '/league-membership/:leagueMembership/summary',
  CertificateController.getSummaryByLeagueMembership,
);

CertificateRoutes.route('/:_id')
  .get(CertificateController.getById)
  .patch(CertificateController.update)
  .delete(CertificateController.destroy);

export default CertificateRoutes;
