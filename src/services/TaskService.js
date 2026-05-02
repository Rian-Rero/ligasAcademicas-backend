import { NotFoundError, BadRequest } from '../errors/baseErrors.js';
import TaskModel from '../models/TaskModel.js';
import UserModel from '../models/UserModel.js';
import * as GoogleCalendarService from './GoogleCalendarService.js';
import * as MailHandlers from '../mail/handlers.js';

async function getUserWithGoogleTokens(userId) {
  if (!userId) return null;

  return UserModel.findById(userId)
    .select(
      '+googleCalendarLinked +googleCalendarAccessToken +googleCalendarRefreshToken +googleCalendarTokenExpiryDate +googleCalendarScope',
    )
    .lean()
    .exec();
}

async function getUserById(userId) {
  return UserModel.findById(userId)
    .select({ _id: 1, email: 1, name: 1 })
    .lean()
    .exec();
}

function ensureGoogleIsLinked(userData) {
  return Boolean(
    userData?.googleCalendarLinked && userData?.googleCalendarRefreshToken,
  );
}

async function persistRefreshedUserTokens(userId, tokenData) {
  if (!tokenData) return;

  await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        googleCalendarAccessToken: tokenData.accessToken,
        googleCalendarRefreshToken: tokenData.refreshToken,
        googleCalendarTokenExpiryDate: tokenData.tokenExpiryDate,
        googleCalendarScope: tokenData.scope,
      },
    },
    { new: true },
  ).exec();
}

export async function get(inputFilters) {
  const { dueDateBefore, dueDateAfter, completed, ...dbFilters } = inputFilters;

  if (completed !== undefined) {
    dbFilters.completed = completed;
  }

  if (dueDateAfter || dueDateBefore) {
    dbFilters.dueDate = {
      ...(dueDateAfter && { $gte: dueDateAfter }),
      ...(dueDateBefore && { $lte: dueDateBefore }),
    };
  }

  return TaskModel.find(dbFilters).sort({ dueDate: 1 }).lean().exec();
}

export async function getById(_id) {
  const foundTask = await TaskModel.findById(_id).lean().exec();
  if (!foundTask) throw new NotFoundError('Task not found');

  return foundTask;
}

export async function create({ inputData, actorUserId }) {
  const assignedToUser = await getUserById(inputData.assignedTo);
  if (!assignedToUser) throw new NotFoundError('Assigned user not found');

  const newTask = await TaskModel.create({
    ...inputData,
    assignedBy: actorUserId,
  });

  // Try to create Google Calendar event (all-day reminder)
  const assignedToUserWithTokens = await getUserWithGoogleTokens(
    inputData.assignedTo,
  );

  if (
    assignedToUserWithTokens &&
    ensureGoogleIsLinked(assignedToUserWithTokens)
  ) {
    try {
      const { googleEventId, refreshedTokenData } =
        await GoogleCalendarService.createGoogleCalendarEvent({
          userTokens: assignedToUserWithTokens,
          event: {
            title: `📋 Tarefa: ${newTask.title}`,
            description: newTask.description,
            dateTime: newTask.dueDate,
            location: '',
            isAllDay: true,
          },
        });

      newTask.googleCalendarEventId = googleEventId;
      await TaskModel.updateOne(
        { _id: newTask._id },
        { googleCalendarEventId: googleEventId },
      );

      await persistRefreshedUserTokens(
        inputData.assignedTo,
        refreshedTokenData,
      );
    } catch (error) {
      console.error('Failed to create Google Calendar event for task:', error);
      // Don't throw error - task creation should succeed even if calendar sync fails
    }
  }

  // Send email notification
  try {
    await MailHandlers.taskDelegated({
      assignee: assignedToUser,
      task: newTask.toObject ? newTask.toObject() : newTask,
    });
  } catch (error) {
    console.error('Failed to send task delegation email:', error);
  }

  return newTask;
}

export async function update({ _id, inputData, actorUserId }) {
  const foundTask = await TaskModel.findById(_id).exec();
  if (!foundTask) throw new NotFoundError('Task not found');

  // Check if user is authorized to update
  const isAssignedBy = foundTask.assignedBy.toString() === actorUserId;
  const isAssignedTo = foundTask.assignedTo.toString() === actorUserId;

  if (!isAssignedBy && !isAssignedTo) {
    throw new BadRequest('You are not authorized to update this task');
  }

  Object.assign(foundTask, inputData);
  const updatedTask = await foundTask.save();

  return updatedTask.toObject();
}

export async function completeTask({ _id, actorUserId }) {
  const foundTask = await TaskModel.findById(_id).exec();
  if (!foundTask) throw new NotFoundError('Task not found');

  // Check if user is the one assigned to this task
  if (foundTask.assignedTo.toString() !== actorUserId) {
    throw new BadRequest('Only the assigned user can complete this task');
  }

  foundTask.completed = true;
  foundTask.completedAt = new Date();
  const updatedTask = await foundTask.save();

  // Get the assigner user to send notification
  const assignerUser = await getUserById(foundTask.assignedBy);
  if (assignerUser) {
    try {
      const assignedUser = await getUserById(foundTask.assignedTo);
      await MailHandlers.taskCompleted({
        assigner: assignerUser,
        assignee: assignedUser,
        task: updatedTask.toObject(),
      });
    } catch (error) {
      console.error('Failed to send task completion email:', error);
    }
  }

  return updatedTask.toObject();
}

export async function destroy({ _id, actorUserId }) {
  const foundTask = await TaskModel.findById(_id).exec();
  if (!foundTask) throw new NotFoundError('Task not found');

  // Check if user is authorized to delete
  const isAssignedBy = foundTask.assignedBy.toString() === actorUserId;

  if (!isAssignedBy) {
    throw new BadRequest('Only the task creator can delete this task');
  }

  // Delete from Google Calendar if exists
  if (foundTask.googleCalendarEventId) {
    const assignedToUser = await getUserWithGoogleTokens(foundTask.assignedTo);
    if (assignedToUser && ensureGoogleIsLinked(assignedToUser)) {
      try {
        await GoogleCalendarService.deleteGoogleCalendarEvent({
          userTokens: assignedToUser,
          googleEventId: foundTask.googleCalendarEventId,
        });
      } catch (error) {
        console.error('Failed to delete Google Calendar event:', error);
      }
    }
  }

  await TaskModel.deleteOne({ _id });
}
