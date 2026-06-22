import { describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import UserModel from '../../../models/UserModel.js';
import UserSessionTokenModel from '../../../models/UserSessionTokenModel.js';
import { createUser } from '../../helpers/factories.js';

vi.mock('../../../utils/libs/cloudinary/index.js', () => ({
  default: {
    uploadFile: vi.fn().mockResolvedValue({
      url: 'https://cdn.test/image.jpg',
      key: 'users/image/123',
    }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

async function getCloudinary() {
  return (await import('../../../utils/libs/cloudinary/index.js')).default;
}

describe('UserModel schema validation', () => {
  it('creates a user with all required fields', async () => {
    const user = await UserModel.create({
      name: 'Test User',
      email: 'testuser@example.com',
    });

    expect(user.name).toBe('Test User');
    expect(user.email).toBe('testuser@example.com');
    expect(user._id).toBeDefined();
  });

  it('rejects creation when name is missing', async () => {
    await expect(
      UserModel.create({ email: 'noname@test.com' }),
    ).rejects.toThrow();
  });

  it('rejects creation when email is missing', async () => {
    await expect(UserModel.create({ name: 'No Email' })).rejects.toThrow();
  });

  it('lowercases the email field', async () => {
    const user = await UserModel.create({
      name: 'Lowercase User',
      email: 'LOWERCASE@EXAMPLE.COM',
    });

    expect(user.email).toBe('lowercase@example.com');
  });

  it('trims whitespace from name', async () => {
    const user = await UserModel.create({
      name: '  Trimmed Name  ',
      email: 'trimmed@example.com',
    });

    expect(user.name).toBe('Trimmed Name');
  });

  it('defaults emailVerified to false', async () => {
    const user = await UserModel.create({
      name: 'Unverified',
      email: 'unverified@example.com',
    });

    expect(user.emailVerified).toBe(false);
  });

  it('defaults mustChangePassword to false', async () => {
    const user = await UserModel.create({
      name: 'MustChange',
      email: 'mustchange@example.com',
    });

    expect(user.mustChangePassword).toBe(false);
  });

  it('defaults googleCalendarLinked to false', async () => {
    const user = await UserModel.create({
      name: 'Google User',
      email: 'google@example.com',
    });

    expect(user.googleCalendarLinked).toBe(false);
  });

  it('defaults googleCalendarEmail to null', async () => {
    const user = await UserModel.create({
      name: 'Google Email',
      email: 'googleemail@example.com',
    });

    expect(user.googleCalendarEmail).toBeNull();
  });

  it('adds createdAt and updatedAt timestamps', async () => {
    const user = await UserModel.create({
      name: 'Timestamp User',
      email: 'timestamp@example.com',
    });

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('image defaults to undefined', async () => {
    const user = await UserModel.create({
      name: 'No Image',
      email: 'noimage@example.com',
    });

    expect(user.image).toBeUndefined();
  });
});

describe('UserModel pre save hook — password hashing', () => {
  it('hashes the password on initial save', async () => {
    const user = await UserModel.create({
      name: 'Hashed Pwd',
      email: 'hashedpwd@example.com',
      password: 'PlainPassword@1',
    });

    const withPwd = await UserModel.findById(user._id)
      .select('+password')
      .lean()
      .exec();

    expect(withPwd.password).not.toBe('PlainPassword@1');
    const isMatch = await bcrypt.compare('PlainPassword@1', withPwd.password);
    expect(isMatch).toBe(true);
  });

  it('hashes the password when it is modified', async () => {
    const user = await UserModel.create({
      name: 'Update Pwd',
      email: 'updatepwd@example.com',
      password: 'Initial@1',
    });

    const doc = await UserModel.findById(user._id).select('+password').exec();
    doc.password = 'NewPassword@2';
    await doc.save();

    const updated = await UserModel.findById(user._id)
      .select('+password')
      .lean()
      .exec();
    expect(updated.password).not.toBe('NewPassword@2');
    const isMatch = await bcrypt.compare('NewPassword@2', updated.password);
    expect(isMatch).toBe(true);
  });

  it('does not re-hash the password when an unrelated field is modified', async () => {
    const user = await UserModel.create({
      name: 'No Rehash',
      email: 'norehash@example.com',
      password: 'Stable@1',
    });

    const withPwd = await UserModel.findById(user._id)
      .select('+password')
      .lean()
      .exec();
    const originalHash = withPwd.password;

    const doc = await UserModel.findById(user._id).select('+password').exec();
    doc.name = 'Updated Name';
    await doc.save();

    const afterSave = await UserModel.findById(user._id)
      .select('+password')
      .lean()
      .exec();
    expect(afterSave.password).toBe(originalHash);
  });
});

describe('UserModel deleteOne (document hook)', () => {
  it('deletes session tokens when document is deleted', async () => {
    const user = await createUser({ email: 'tokendelete@example.com' });

    await UserSessionTokenModel.create({
      user: user._id,
      token: 'some-token-abc',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const doc = await UserModel.findById(user._id).exec();
    await doc.deleteOne();

    const remaining = await UserSessionTokenModel.find({ user: user._id });
    expect(remaining).toHaveLength(0);
  });

  it('calls cloudinary.deleteFile when user has an image key', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'Image User',
      email: 'imageuser@example.com',
      image: { key: 'users/image/del-key', url: 'https://cdn.test/del.jpg' },
    });

    const doc = await UserModel.findById(user._id).exec();
    await doc.deleteOne();

    expect(cloudinary.deleteFile).toHaveBeenCalledWith('users/image/del-key');
  });

  it('does not call cloudinary.deleteFile when user has no image', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'No Image User',
      email: 'noimageuser@example.com',
    });

    const doc = await UserModel.findById(user._id).exec();
    await doc.deleteOne();

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });
});

describe('UserModel deleteOne (query hook)', () => {
  it('calls cloudinary.deleteFile when matched user has an image', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'Query Image User',
      email: 'queryimage@example.com',
      image: {
        key: 'users/image/query-del',
        url: 'https://cdn.test/query-del.jpg',
      },
    });

    await UserModel.deleteOne({ _id: user._id });

    expect(cloudinary.deleteFile).toHaveBeenCalledWith('users/image/query-del');
  });

  it('does not call cloudinary.deleteFile when matched user has no image', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'Query No Image',
      email: 'querynoimage@example.com',
    });

    await UserModel.deleteOne({ _id: user._id });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('does nothing when no user matches the query', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    await UserModel.deleteOne({ _id: new mongoose.Types.ObjectId() });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });
});

describe('UserModel findOneAndDelete hook', () => {
  it('calls cloudinary.deleteFile when the found user has an image', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'FindDel Image User',
      email: 'finddel-image@example.com',
      image: {
        key: 'users/image/finddel-key',
        url: 'https://cdn.test/finddel.jpg',
      },
    });

    await UserModel.findOneAndDelete({ _id: user._id });

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'users/image/finddel-key',
    );
  });

  it('does not call cloudinary.deleteFile when matched user has no image', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const user = await UserModel.create({
      name: 'FindDel No Image',
      email: 'finddel-noimage@example.com',
    });

    await UserModel.findOneAndDelete({ _id: user._id });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('does nothing when no user matches', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    await UserModel.findOneAndDelete({ _id: new mongoose.Types.ObjectId() });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes session tokens via findOneAndDelete path', async () => {
    const user = await createUser({ email: 'finddel-token@example.com' });

    await UserSessionTokenModel.create({
      user: user._id,
      token: 'token-for-finddel',
      expiresAt: new Date(Date.now() + 86400000),
    });

    await UserModel.findOneAndDelete({ _id: user._id });

    const remaining = await UserSessionTokenModel.find({ user: user._id });
    expect(remaining).toHaveLength(0);
  });
});
