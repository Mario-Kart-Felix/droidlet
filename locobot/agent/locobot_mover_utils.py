"""
Copyright (c) Facebook, Inc. and its affiliates.
"""
import numpy as np
import logging
from rotation import yaw_pitch
from scipy.spatial.transform import Rotation

MAX_PAN_RAD = np.pi / 4
CAMERA_HEIGHT = 0.6
ARM_HEIGHT = 0.5


def angle_diff(a, b):
    r = b - a
    r = r % (2 * np.pi)
    if r > np.pi:
        r = r - 2 * np.pi
    return r


def get_camera_angles(camera_pos, look_at_pnt):
    """get the new yaw/pan and pitch/tilt angle values and update the camera's
    new look direction."""
    logging.debug(f"look_at_point: {np.array(look_at_pnt)}")
    logging.debug(f"camera_position: {np.array(camera_pos)}")
    logging.debug(f"difference: {np.array(look_at_pnt) - np.array(camera_pos)}")
    look_dir = np.array(look_at_pnt) - np.array(camera_pos)
    logging.debug(f"Un-normalized look direction: {look_dir}")
    if np.linalg.norm(look_dir) < 0.01:
        return 0.0, 0.0
    look_dir = look_dir / np.linalg.norm(look_dir)
    return yaw_pitch(look_dir)


def get_arm_angle(locobot_pos, marker_pos):
    H = 0.2
    dir_xy_vect = np.array(marker_pos)[:2] - np.array(locobot_pos)[:2]
    angle = -np.arctan((marker_pos[2] - H) / np.linalg.norm(dir_xy_vect))
    return angle


def get_bot_angle(locobot_pos, marker_pos):
    dir_xy_vect = np.array(marker_pos)[:2] - np.array(locobot_pos)[:2]
    angle = np.arctan(dir_xy_vect[1] / dir_xy_vect[0])
    return angle


def transform_pose(XYZ, current_pose):
    """
    Transforms the point cloud into geocentric frame to account for
    camera position
    Input:
        XYZ                     : ...x3
    current_pose            : camera position (x, y, theta (radians))
    Output:
        XYZ : ...x3
    """
    R = Rotation.from_euler("Z", current_pose[2]).as_matrix()
    XYZ = np.matmul(XYZ.reshape(-1, 3), R.T).reshape((-1, 3))
    XYZ[:, 0] = XYZ[:, 0] + current_pose[0]
    XYZ[:, 1] = XYZ[:, 1] + current_pose[1]
    return XYZ


def base_canonical_coords_to_pyrobot_coords(xyt):
    """converts the robot's base coords from canonical to pyrobot coords."""
    return [xyt[1], -xyt[0], xyt[2]]


def xyz_pyrobot_to_canonical_coords(xyz):
    """converts 3D coords from pyrobot to canonical coords."""
    return [-xyz[1], xyz[2], xyz[0]]
