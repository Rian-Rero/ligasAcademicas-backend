import { Router } from 'express';
import AcademicLeagueRoutes from './AcademicLeaguesRoutes.js';
import AttendanceRoutes from './AttendancesRoutes.js';
import CertificateRoutes from './CertificatesRoutes.js';
import EventRoutes from './EventsRoutes.js';
import LeagueMembershipRoutes from './LeagueMembershipsRoutes.js';
import SessionRoutes from './SessionsRoutes.js';
import SquadRoutes from './SquadsRoutes.js';
import UniversityRoutes from './UniversitiesRoutes.js';
import UserRoutes from './UsersRoutes.js';
import PermissionsRoutes from './PermissionsRoutes.js';

const routes = Router();

routes
  .use('/', SessionRoutes)
  .use('/academic-leagues', AcademicLeagueRoutes)
  .use('/attendances', AttendanceRoutes)
  .use('/certificates', CertificateRoutes)
  .use('/events', EventRoutes)
  .use('/league-memberships', LeagueMembershipRoutes)
  .use('/permissions', PermissionsRoutes)
  .use('/squads', SquadRoutes)
  .use('/users', UserRoutes)
  .use('/universities', UniversityRoutes);

export default routes;
