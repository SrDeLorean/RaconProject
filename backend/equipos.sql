-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 24-06-2026 a las 13:12:13
-- Versión del servidor: 10.6.24-MariaDB-cll-lve
-- Versión de PHP: 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `comunid6_comunidad_amc`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `abreviatura` varchar(10) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `color_primario` varchar(255) DEFAULT NULL,
  `clubId` varchar(255) DEFAULT NULL,
  `color_secundario` varchar(255) DEFAULT NULL,
  `logo` varchar(255) NOT NULL DEFAULT 'images/equipos/default-equipo.png',
  `id_formacion` bigint(20) UNSIGNED DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `twitch` varchar(255) DEFAULT NULL,
  `youtube` varchar(255) DEFAULT NULL,
  `id_usuario` bigint(20) UNSIGNED DEFAULT NULL,
  `id_usuario2` bigint(20) UNSIGNED DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `equipos`
--

INSERT INTO `equipos` (`id`, `nombre`, `abreviatura`, `descripcion`, `color_primario`, `clubId`, `color_secundario`, `logo`, `id_formacion`, `instagram`, `twitch`, `youtube`, `id_usuario`, `id_usuario2`, `deleted_at`, `created_at`, `updated_at`) VALUES
(57, 'BAW Esports', NULL, NULL, '#0c00b8', '329445', '#00801a', 'images/equipos/695f330966d5d.png', 3, 'bawesp', 'https://www.twitch.tv/bawesp', NULL, 1004, 1004, NULL, '2026-01-07 19:17:27', '2026-01-18 21:43:40'),
(58, 'Cerriyork Esports', NULL, NULL, '#ffdd00', '518263', '#fcfcfc', 'images/equipos/695fa7ad1d22e.png', 11, 'http://www.instagram.com/cerriyork_esports', 'http://twitch.tv/panchoginza', NULL, 947, 947, NULL, '2026-01-07 19:19:13', '2026-05-25 17:31:08'),
(59, 'Urban Knight Esports', NULL, NULL, '#2b15d1', '67555', '#ffffff', 'images/equipos/6a15e46845b4d.jpg', 4, NULL, NULL, NULL, 2639, 2639, NULL, '2026-01-07 19:20:30', '2026-05-26 22:20:24'),
(66, 'Fc Chanchitos', NULL, NULL, '#b92d5d', '58829', '#000000', 'images/equipos/69601dd1e0894.png', 20, NULL, NULL, NULL, 1228, 1228, NULL, '2026-01-07 19:23:45', '2026-01-18 22:35:31'),
(68, 'Vikings Esports', NULL, NULL, '#fbff00', '2358433', '#000000', 'images/equipos/69606859cf10a.png', 15, NULL, NULL, NULL, 1291, 1291, NULL, '2026-01-07 19:24:08', '2026-03-17 21:41:17'),
(77, 'Deathgunners FC', NULL, 'DeathGunners\r\nDeathgunners_eSports ⚔️🎮\r\nEquipo competitivo de eSports\r\n🎯 Pasión, estrategia\r\n🏆Campeones @espaciogamer.cl\r\n🥈Segundo en @gamercupleague\r\nlinktr.ee/DG2MIL\r\ncarlos.lob05, xc4rl0s_l05x y', '#ff0000', '64956', '#000000', 'images/equipos/6964e618e27dc.png', 1, 'https://www.instagram.com/deathgunners_esports/', 'https://www.twitch.tv/dg2mil', 'https://www.youtube.com/@DeathGunners', 1023, 1023, NULL, '2026-01-07 19:27:23', '2026-01-18 23:03:11'),
(82, 'Resistencia SPS', NULL, NULL, '#ff0000', '126637', '#ccc231', 'images/equipos/695fd27ca7570.jpg', 23, 'https://www.instagram.com/resistencia_sps?igsh=MTFsMW13dzFjbWZjbw==', NULL, NULL, 1151, 1194, NULL, '2026-01-07 19:28:11', '2026-01-18 23:00:35'),
(89, 'AllBlacks', NULL, NULL, '#eee3e3', '147952', '#272020', 'images/equipos/695e928588e8d.png', NULL, NULL, NULL, NULL, 1005, 1005, NULL, '2026-01-07 19:29:07', '2026-01-19 01:52:43'),
(90, 'CITYZENS FC', NULL, NULL, '#0000ff', '4187358', '#27dadd', 'images/equipos/6a2ff6ab2d35c.png', 24, NULL, NULL, NULL, 1157, 1157, NULL, '2026-01-07 19:29:19', '2026-06-15 16:57:15'),
(92, 'Basofia Castilla', NULL, NULL, '#e22828', '70191', '#ffffff', 'images/equipos/6964fbf99b60a.jpg', 15, NULL, NULL, NULL, 1111, 1111, NULL, '2026-01-07 19:29:44', '2026-03-10 15:52:17'),
(96, 'Voranix Esp', NULL, NULL, '#ff00ff', '3890601', '#ffffff', 'images/equipos/699c490ebcc5e.jpg', NULL, NULL, NULL, NULL, 1340, 1340, NULL, '2026-01-07 19:30:49', '2026-02-23 15:33:18'),
(100, 'Sangre Nueva', NULL, NULL, '#ff0000', '141983', '#ffffff', 'images/equipos/6960411a44f84.png', 10, 'S4NGRE_NUEVA', NULL, NULL, 1205, 1205, NULL, '2026-01-07 19:32:46', '2026-01-20 03:41:48'),
(103, 'Joga Feiito FC', NULL, 'JOGA FEIITO FC ⚽🏁🏁', '#392d2d', '11503', '#ffffff', 'images/equipos/696160f245d31.png', 24, 'JOGA FEIITO FC', NULL, NULL, 1089, 1089, NULL, '2026-01-07 19:33:04', '2026-04-27 17:30:01'),
(104, 'Impacto United', NULL, NULL, '#1f0637', '4464860', '#000000', 'images/equipos/6a109a533919b.jpeg', 3, 'https://www.instagram.com/impactounited/', NULL, NULL, 2846, 2846, NULL, '2026-01-07 19:33:10', '2026-06-16 05:58:53'),
(105, 'Red Devils SP', NULL, NULL, '#943b00', '1797012', '#ffffff', 'images/equipos/69655078c66e1.jpg', 3, 'https://www.instagram.com/reddevilssp?igsh=MTlmc2U5aDc1MWswZQ==', NULL, NULL, 1016, 1016, NULL, '2026-01-07 19:33:20', '2026-02-09 06:29:12'),
(106, 'Horizon Esports', NULL, NULL, '#0061fe', '2920', '#ffffff', 'images/equipos/695fd06417b86.jpeg', 3, 'https://www.instagram.com/hze_esports?igsh=MThkY2xmZm9uazNrbQ==', NULL, NULL, 1146, 1146, NULL, '2026-01-07 19:33:41', '2026-02-03 21:30:24'),
(107, 'Rechazados FC', NULL, NULL, '#a00d0d', '1322723', '#ffffff', 'images/equipos/69650effb032f.jpeg', 21, NULL, NULL, NULL, 1006, 1006, NULL, '2026-01-07 19:33:48', '2026-01-19 01:54:57'),
(108, 'LosCacasFC', NULL, NULL, '#5f0066', '253306', '#05e1dd', 'images/equipos/69c158a10d32d.jpeg', 2, 'www.instagram.com/loscacasfc', 'www.twich.tv/clubdetotti', 'www.youtube.com/clubdetotti', 1600, 1600, NULL, '2026-01-07 19:33:58', '2026-03-23 21:45:33'),
(110, 'Raccoon Reapers eSports', NULL, NULL, '#0ed600', '2518584', '#000000', 'images/equipos/69657d1fecf02.png', 11, NULL, NULL, NULL, 1555, 1555, NULL, '2026-01-08 04:42:10', '2026-03-11 15:56:03'),
(120, 'Barrio Unido', NULL, NULL, '#000000', '4272003', '#00ff00', 'images/equipos/69b028de4fb70.jpg', 16, 'https://www.instagram.com/p/DVI2q9xkaVy/?igsh=MTB4ejF5Z2xyYno4Zw==', NULL, NULL, 1642, 1642, NULL, '2026-03-10 15:26:18', '2026-03-24 01:31:46'),
(123, 'Sexta eSp', NULL, NULL, '#e22400', '67416', '#000000', 'images/equipos/69b415477f4dc.jpeg', 22, NULL, NULL, NULL, 2162, 2162, NULL, '2026-03-10 15:38:26', '2026-03-22 22:21:18'),
(125, 'Huachipato eSp', NULL, NULL, '#0008ff', '3220543', '#000000', 'images/equipos/69bca969cc28e.png', 22, 'huachipatoesports', NULL, NULL, 2294, 2294, NULL, '2026-03-10 15:41:28', '2026-03-24 06:07:21'),
(128, 'San Lorenzo eSp', NULL, NULL, '#000000', '1500250', '#ffffff', 'images/equipos/69c07eafa289f.png', NULL, NULL, NULL, NULL, 1648, 1648, NULL, '2026-03-10 15:46:52', '2026-03-23 02:43:43'),
(129, 'Barrio Puerto', NULL, NULL, '#fbe704', '4043931', '#000000', 'images/equipos/69b9b85e89517.jpg', 3, NULL, NULL, NULL, 1326, 1326, NULL, '2026-03-10 15:47:19', '2026-05-12 16:40:28'),
(130, 'Akatsuki FC', NULL, NULL, '#000000', '2400735', '#ff0000', 'images/equipos/69c0512f08db7.jpg', 20, 'https://www.instagram.com/fc_akatsuki_pro?igsh=NTBwaWpydWg1ZTM3', 'https://www.twitch.tv/fc_akatsuk1', NULL, 2298, 2298, NULL, '2026-03-10 15:47:41', '2026-06-17 04:28:07'),
(133, 'Gen Esports', NULL, NULL, '#000000', '4294850', '#5c0701', 'images/equipos/6a146dde1e913.png', NULL, NULL, NULL, NULL, 967, 967, NULL, '2026-03-10 15:50:31', '2026-05-25 19:42:22'),
(135, 'New Pirats FC', NULL, NULL, '#ffff00', '4122298', '#000000', 'images/equipos/69bc5db4cc404.jpg', 7, NULL, NULL, NULL, 2027, 2185, NULL, '2026-03-10 15:51:57', '2026-04-08 05:35:19'),
(136, 'Maiden eSp', NULL, NULL, '#000000', '4032820', '#ffffff', 'images/equipos/69c07ef499186.jpg', NULL, NULL, NULL, NULL, 2104, 2104, NULL, '2026-03-10 15:52:31', '2026-03-23 02:44:52'),
(138, 'Deportes Puerto Montt', NULL, 'Deportes Puerto Montt eSports (DPM)', '#008000', '231235', '#ffffff', 'images/equipos/69b1cdc9b5191.png', 15, 'https://www.instagram.com/dpm.esports?utm_source=qr&igsh=MXdqMmR6ZjFqd3A3aQ==', 'https://www.twitch.tv/dpmesports?sr=a', NULL, 2118, 2118, NULL, '2026-03-10 15:52:55', '2026-03-20 20:47:29'),
(140, 'Toros eSp', NULL, NULL, '#000000', '118692', '#ff0000', 'images/equipos/69b2f72801e01.png', 3, NULL, NULL, NULL, 1502, 1502, NULL, '2026-03-11 15:51:20', '2026-03-20 04:44:05'),
(141, 'Naval eSp', NULL, NULL, '#ff0000', '245331', '#000000', 'images/equipos/69c1450250462.png', 2, NULL, NULL, NULL, 2115, 2410, NULL, '2026-03-11 15:52:09', '2026-06-16 04:52:35'),
(143, 'Wanderers Esp', NULL, NULL, '#0fb823', '390439', '#ffffff', 'images/equipos/6a242e5878529.jpg', NULL, NULL, NULL, NULL, 1453, 1407, NULL, '2026-03-11 15:53:01', '2026-06-06 18:27:36'),
(145, 'Indisciplina FC', NULL, NULL, '#e22400', '509011', '#ffffff', 'images/equipos/69dee7cde8c5c.jpeg', NULL, NULL, NULL, NULL, 2278, 2278, NULL, '2026-03-11 15:54:29', '2026-04-15 05:20:13'),
(146, 'Chile Sub 20', NULL, NULL, '#e22400', '2945280', '#ffffff', 'images/equipos/69cc61966f0af.jpeg', 17, NULL, NULL, NULL, 2528, 2528, NULL, '2026-03-14 23:09:37', '2026-04-06 21:37:49'),
(147, 'Wolves eSp', NULL, NULL, '#000000', '18126', '#ffffff', 'images/equipos/69c00b378aa7f.jpg', 20, NULL, NULL, NULL, 2217, 2217, NULL, '2026-03-16 16:16:54', '2026-03-22 18:32:03'),
(148, 'Anubis Black Esp', NULL, NULL, '#000000', '66381', '#ffff00', 'images/equipos/69bc09c40c0c0.png', 1, NULL, NULL, NULL, 2296, 2296, NULL, '2026-03-19 16:06:24', '2026-03-19 17:35:48'),
(149, 'Bizarros FC', NULL, NULL, '#000000', '69322', '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, 953, 953, NULL, '2026-03-19 16:11:15', '2026-04-22 03:18:39'),
(150, 'FC Pariente', NULL, NULL, '#000000', '397129', '#ffffff', 'images/equipos/69bc368c4dd9e.jpeg', NULL, NULL, NULL, NULL, 2302, 2302, NULL, '2026-03-19 16:27:54', '2026-03-22 22:18:53'),
(151, 'BSG Esports', NULL, NULL, '#000000', '22447', '#ffffff', 'images/equipos/6a1349699db21.png', NULL, 'ultra.instinct.fc', NULL, NULL, 1866, 1866, NULL, '2026-03-19 16:28:33', '2026-05-25 04:02:03'),
(152, 'Toho Esports', NULL, NULL, '#000000', '3994926', '#ffffff', 'images/equipos/69e1a14bf31df.jpeg', 20, NULL, NULL, NULL, 1515, 1515, NULL, '2026-03-20 04:41:36', '2026-04-17 06:56:11'),
(153, 'Chilensi Esports', NULL, NULL, '#000000', '3333535', '#ffffff', 'images/equipos/69c2bd52a0a2b.jpg', NULL, NULL, NULL, NULL, 1513, 1513, NULL, '2026-03-20 19:19:59', '2026-03-24 19:35:30'),
(154, 'POR DETERMINAR', NULL, NULL, NULL, NULL, NULL, 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-31 16:44:18', '2026-03-31 16:44:18'),
(155, 'SL Gaming', NULL, '¡Somos fuertes!', '#000000', '186057', '#ff0000', 'images/equipos/6a1357f1dcb44.jpg', 7, NULL, NULL, NULL, 1748, 1748, NULL, '2026-05-14 04:53:55', '2026-05-25 02:11:11'),
(156, 'Infames esp', NULL, NULL, '#000000', '30850', '#dfa70c', 'images/equipos/6a089c0492886.png', NULL, NULL, NULL, NULL, 2724, 2724, NULL, '2026-05-14 04:54:12', '2026-05-22 03:21:51'),
(157, 'Grizzly Gaming', NULL, NULL, '#ff0000', '66352', '#ffffff', 'images/equipos/6a0df5497ad22.png', 24, 'Grizzlygaming.cl', NULL, NULL, 1864, 1864, NULL, '2026-05-14 04:54:41', '2026-05-20 21:54:17'),
(158, 'Guatones FC', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 04:57:22', '2026-05-14 04:57:22'),
(159, 'Huachipato eSp', NULL, NULL, '#171eee', '3220543', '#ffffff', 'images/equipos/6a2ff59c512de.jpeg', NULL, NULL, NULL, NULL, 2322, 2322, NULL, '2026-05-14 04:57:32', '2026-06-15 16:52:44'),
(160, 'Oriente Esports', NULL, NULL, '#2d9a0e', '1789858', '#ffffff', 'images/equipos/6a138d15b51c8.jpeg', NULL, NULL, NULL, NULL, 2973, 2973, NULL, '2026-05-14 04:57:48', '2026-05-25 03:46:46'),
(161, 'Slifer Gaming', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 04:58:00', '2026-05-14 04:58:00'),
(162, 'Toxicos AC', NULL, NULL, '#000000', '125343', '#ffffff', 'images/equipos/6a137a2a9602e.jpeg', NULL, NULL, NULL, NULL, 1137, 1137, NULL, '2026-05-14 04:58:12', '2026-05-25 02:22:34'),
(163, 'UM Gaming', NULL, NULL, '#a3a446', '4753847', '#ffffff', 'images/equipos/6a138aa0e15a3.jpeg', NULL, NULL, NULL, NULL, 1780, 1780, NULL, '2026-05-14 04:58:21', '2026-05-27 00:03:25'),
(164, 'Mufasa Esports', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 04:58:29', '2026-05-14 04:58:29'),
(165, 'Black Dogs FC', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 04:58:44', '2026-05-14 04:58:44'),
(166, 'Rangers Esports', NULL, NULL, '#ff0000', '4387309', '#000000', 'images/equipos/6a0bf570ecb58.png', 11, NULL, NULL, NULL, 1842, 1842, NULL, '2026-05-14 04:58:56', '2026-05-19 09:30:24'),
(167, 'Aribibi FC', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/6a089a6e2a41d.png', NULL, NULL, NULL, NULL, 2169, 2169, NULL, '2026-05-14 04:59:07', '2026-05-16 20:25:18'),
(168, 'The Blacksheep FC', NULL, NULL, '#61187c', '2245742', '#000000', 'images/equipos/6a0cbad5cda6c.jpeg', 20, NULL, NULL, NULL, 2695, 2695, NULL, '2026-05-14 05:00:13', '2026-05-19 23:32:37'),
(169, 'Aurinegro Esports', NULL, NULL, '#ffff00', '50846', '#000000', 'images/equipos/6a0c7bb20c377.png', NULL, NULL, NULL, NULL, 951, 951, NULL, '2026-05-14 05:00:22', '2026-05-19 19:03:14'),
(170, 'Cobresal Esports', NULL, NULL, '#ff9300', '23853', '#4f7a28', 'images/equipos/6a11d233e4414.jpeg', 1, 'Cobresal.esports', NULL, NULL, 1657, 1657, NULL, '2026-05-14 05:00:40', '2026-05-25 03:49:25'),
(171, 'Subversivos ESP', NULL, NULL, '#0000ff', '2398536', '#000000', 'images/equipos/6a0df980a0c02.jpeg', NULL, NULL, NULL, NULL, 2807, 2807, NULL, '2026-05-14 05:01:37', '2026-06-21 21:58:58'),
(172, 'Black Lyon FC', NULL, NULL, '#000000', '5566717', '#ff0000', 'images/equipos/6a12011e5ea0a.jpg', 2, 'Black_Lyon_FC', NULL, NULL, 1120, 1120, NULL, '2026-05-14 05:03:19', '2026-06-09 06:39:28'),
(173, 'Yakuza Esp', NULL, NULL, '#d03939', '31505', '#3b1b1b', 'images/equipos/6a13908cbd2c5.jpeg', NULL, NULL, NULL, NULL, 2978, 2978, NULL, '2026-05-14 05:03:29', '2026-05-25 04:01:19'),
(174, 'Los Devotos Esports', NULL, NULL, '#000000', '65718', '#ffffff', 'images/equipos/6a1392f294128.jpeg', NULL, NULL, NULL, NULL, 1852, 1852, NULL, '2026-05-14 05:05:10', '2026-05-25 04:08:18'),
(175, 'San Felipe FC', NULL, NULL, '#f50a0a', '4178249', '#f2eeed', 'images/equipos/6a11d5224f30b.png', 11, NULL, NULL, NULL, 2088, 2088, NULL, '2026-05-14 05:05:37', '2026-06-01 16:52:33'),
(176, 'Golden Cross Fc', NULL, NULL, '#ebdf2d', '5404864', '#ffffff', 'images/equipos/6a138dd7dd4fe.jpeg', NULL, NULL, NULL, NULL, 1833, 1833, NULL, '2026-05-14 05:06:51', '2026-05-25 17:36:19'),
(177, 'T-Albo Esports', NULL, NULL, '#000000', '1166708', '#ffffff', 'images/equipos/6a13922058741.jpeg', NULL, NULL, NULL, NULL, 2729, 2729, NULL, '2026-05-14 05:08:11', '2026-05-25 04:04:48'),
(178, 'La Rojita Esports', NULL, NULL, '#f91f1f', '254580', '#ffffff', 'images/equipos/6a1469402e3d9.jpeg', NULL, NULL, NULL, NULL, 1243, 1243, NULL, '2026-05-14 05:08:40', '2026-05-25 19:22:40'),
(179, 'O\'Higgins Esports', NULL, NULL, '#0000ff', '5983747', '#00ff00', 'images/equipos/6a1fb95bc8266.jpg', NULL, NULL, NULL, NULL, 2011, 2011, NULL, '2026-05-14 05:09:13', '2026-06-06 18:13:19'),
(181, 'BsK Esports', NULL, NULL, '#012f7b', '2263761', '#ffffff', 'images/equipos/6a08a636e7f63.png', 24, 'https://www.instagram.com/bskesportfc?igsh=eGE4cXd6Z2JxZDdo&utm_source=qr', NULL, NULL, 1160, 1160, NULL, '2026-05-14 05:09:40', '2026-05-23 19:25:08'),
(182, 'Tropiconce CF', NULL, NULL, '#203b1f', '484024', '#000000', 'images/equipos/6a0f706c98db4.png', 20, 'https://www.instagram.com/tropiconce_cf?igsh=MWVnanJvYmF1bnNwdQ==', NULL, NULL, 2786, 2786, NULL, '2026-05-14 05:09:51', '2026-05-27 16:28:48'),
(183, 'BOCASECA eSp', NULL, NULL, '#000000', '1769142', '#ffffff', 'images/equipos/6a13939c82e7a.jpeg', NULL, NULL, NULL, NULL, 989, 989, NULL, '2026-05-14 05:10:01', '2026-05-25 04:11:08'),
(184, 'La Pequeña Italia', NULL, NULL, '#0061fe', '2652746', '#ffffff', 'images/equipos/6a08a6fc15b93.png', 21, '@fcpequenaitalia', NULL, NULL, 2710, 2710, NULL, '2026-05-14 05:10:33', '2026-05-19 00:37:32'),
(185, 'CONCEPCION CITY CLUB', NULL, NULL, '#0b1837', '225781', '#ffffff', 'images/equipos/6a13190b735dc.jpeg', 18, NULL, NULL, NULL, 1563, 1563, NULL, '2026-05-14 05:10:49', '2026-05-26 18:49:33'),
(186, 'Real Forza FC', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 05:10:59', '2026-05-14 05:10:59'),
(187, 'Bluelock Esports', NULL, NULL, '#000000', '236682', '#ffffff', 'images/equipos/6a0f748724797.jpg', NULL, NULL, NULL, NULL, 1156, 1156, NULL, '2026-05-14 05:11:17', '2026-05-22 01:09:27'),
(188, 'Chelsi Chile FC', NULL, NULL, '#000000', NULL, '#ffffff', 'images/equipos/default-equipo.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-14 05:11:28', '2026-05-14 05:11:28'),
(189, 'Reset Esports', NULL, NULL, '#000000', '5768329', '#b51a00', 'images/equipos/6a08d297a6cc7.png', 3, NULL, NULL, NULL, 2744, 2744, NULL, '2026-05-16 20:24:57', '2026-06-20 02:00:12'),
(190, 'Androides eSp', NULL, NULL, '#0e0be0', '3597265', '#ffffff', 'images/equipos/6a13772652b18.jpeg', NULL, NULL, NULL, NULL, 1961, 1961, NULL, '2026-05-19 19:51:34', '2026-05-25 02:10:02'),
(191, 'Asado y Fasito FC', NULL, 'El mas grande del municipio.', '#040839', '3594457', '#ffffff', 'images/equipos/6a0de9ed2daa5.jpeg', 19, NULL, NULL, NULL, 2753, 2753, NULL, '2026-05-20 20:46:35', '2026-05-25 03:34:47'),
(192, 'Antifutbol FC', NULL, NULL, '#cc0000', '3189583', '#0b5c00', 'images/equipos/6a0f8ead897bd.png', 22, NULL, 'Frozty1K', NULL, 1710, 1710, NULL, '2026-05-22 02:44:08', '2026-06-14 23:22:50'),
(193, 'Blaugranas Esports', NULL, NULL, '#0042a9', '131791', '#831100', 'images/equipos/6a1327d7bab45.jpeg', 11, 'Blaugranas_esports', NULL, NULL, 2829, 2829, NULL, '2026-05-22 02:46:30', '2026-05-25 03:31:58'),
(194, 'LeguaYork eSp', NULL, NULL, '#000000', '5282155', '#f6a904', 'images/equipos/6a11da478d381.jpg', 3, 'leguayork.esp', 'kick Pancho_T14', NULL, 2094, 2094, NULL, '2026-05-22 02:50:02', '2026-06-02 03:50:35'),
(195, 'A Jugar FC', NULL, NULL, '#21ba47', '6247372', '#ffffff', 'images/equipos/6a137a7e9e496.jpeg', NULL, NULL, NULL, NULL, 2840, 2840, NULL, '2026-05-22 03:37:57', '2026-05-25 02:23:58'),
(196, 'Veterans Chile', NULL, NULL, '#a11212', '6414678', '#ffffff', 'images/equipos/6a139c84573d1.jpeg', NULL, NULL, NULL, NULL, 2128, 2128, NULL, '2026-05-23 04:50:05', '2026-05-27 21:37:37'),
(197, 'Piskola Esp', NULL, NULL, '#ffff00', '3927009', '#000000', 'images/equipos/6a11471aa189f.jpg', 3, NULL, NULL, NULL, 2422, 2422, NULL, '2026-05-23 05:40:02', '2026-05-25 04:22:46'),
(198, 'Real Ballestero PL', NULL, NULL, '#000000', '574752', '#ffffff', 'images/equipos/6a1376aff2309.jpeg', NULL, NULL, NULL, NULL, 1790, 1790, NULL, '2026-05-23 21:19:14', '2026-05-25 02:07:43'),
(199, 'Audax Esports', NULL, NULL, '#10601a', '1068388', '#235f9f', 'images/equipos/6a138ebf538fd.jpeg', NULL, NULL, NULL, NULL, 2059, 2059, NULL, '2026-05-24 01:44:37', '2026-05-25 03:50:23'),
(200, 'Niupi Esports', NULL, NULL, '#0000ff', '6934', '#ffffff', 'images/equipos/6a13780bdddeb.jpeg', NULL, NULL, NULL, NULL, 1313, 1313, NULL, '2026-05-24 10:56:20', '2026-05-25 18:40:45'),
(201, 'RR Esports', NULL, NULL, '#1943c2', '1686791', '#ffffff', 'images/equipos/6a137b42e6d3e.png', NULL, NULL, NULL, NULL, 1624, 1624, NULL, '2026-05-24 11:06:39', '2026-05-25 03:40:13'),
(202, 'Caleuche Esp', NULL, NULL, '#6500ca', '69322', '#000000', 'images/equipos/6a29c0d64766f.png', 23, '@elcaleuchefc', NULL, NULL, 3255, 3255, NULL, '2026-05-24 11:16:30', '2026-06-15 17:29:37'),
(203, 'Papayeros Rising', NULL, NULL, '#752f39', '1978233', '#ffffff', 'images/equipos/6a13981255628.png', NULL, NULL, NULL, NULL, 1888, 1888, NULL, '2026-05-24 21:11:40', '2026-05-25 04:30:10'),
(204, 'Pcerdo Esp', NULL, NULL, '#ae3eb6', '1416782', '#ffffff', 'images/equipos/6a13961521a39.jpeg', NULL, NULL, NULL, NULL, 2981, 2981, NULL, '2026-05-24 21:24:48', '2026-05-25 04:21:41'),
(205, 'ACOPLE FC', NULL, NULL, '#000000', '6388', '#ffffff', 'images/equipos/6a149601ceece.jpg', 3, NULL, NULL, NULL, 3046, 3046, NULL, '2026-05-25 22:17:13', '2026-05-26 19:32:58');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipos_id_formacion_foreign` (`id_formacion`),
  ADD KEY `equipos_id_usuario_foreign` (`id_usuario`),
  ADD KEY `equipos_id_usuario2_foreign` (`id_usuario2`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `equipos`
--
ALTER TABLE `equipos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=207;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD CONSTRAINT `equipos_id_formacion_foreign` FOREIGN KEY (`id_formacion`) REFERENCES `formaciones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `equipos_id_usuario2_foreign` FOREIGN KEY (`id_usuario2`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `equipos_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
