const User = require('../models/userModel');

const factory = require('./handleFactory');

// memperolehkan semua user (NANTI)
exports.getAllUsers = factory.getAll(User, 'Berhasil mengakses data pengguna');

// memperolehkan sebuah user (NANTI)

// mengubah user (JANGAN mengubah password dengan ini) NANTI

// menghapus user (NANTI)
