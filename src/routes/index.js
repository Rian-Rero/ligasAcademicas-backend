import { Router } from 'express';
import AcademicLeagueRoutes from './AcademicLeaguesRoutes.js';
import LeagueMembershipRoutes from './LeagueMembershipsRoutes.js';
import SessionRoutes from './SessionsRoutes.js';
import SquadRoutes from './SquadsRoutes.js';
import UniversityRoutes from './UniversitiesRoutes.js';
import UserRoutes from './UsersRoutes.js';

const routes = Router();

routes
  .use('/', SessionRoutes)
  .use('/academic-leagues', AcademicLeagueRoutes)
  .use('/league-memberships', LeagueMembershipRoutes)
  .use('/squads', SquadRoutes)
  .use('/users', UserRoutes)
  .use('/universities', UniversityRoutes);

export default routes;
