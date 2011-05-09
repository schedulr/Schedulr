-- phpMyAdmin SQL Dump
-- version 3.3.10
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Apr 15, 2011 at 03:20 PM
-- Server version: 5.1.49
-- PHP Version: 5.3.3-1ubuntu9.3

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `schedulr_tmp`
--

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `code`, `name`) VALUES
(1, 'ACC', 'Accountancy\n'),
(2, 'ARB', 'Arabic\n'),
(3, 'AAH', 'Art & Art History\n'),
(4, 'AST', 'Astronomy & Astrophysics\n'),
(5, 'ACS', 'Augustine and Culture Seminar\n'),
(6, 'BIO', 'Biology\n'),
(7, 'BL', 'Business Law\n'),
(8, 'CHE', 'Chemical Engineering\n'),
(9, 'CHM', 'Chemistry\n'),
(10, 'CHI', 'Chinese\n'),
(11, 'MSCM', 'Church Management\n'),
(12, 'CEE', 'Civil & Environmental Engr\n'),
(13, 'CLA', 'Classical Studies\n'),
(14, 'COM', 'Communication\n'),
(15, 'CSC', 'Computer Science\n'),
(16, 'CHR', 'Counseling & Human Relations\n'),
(17, 'CRJ', 'Criminal Justice\n'),
(18, 'DIT', 'Decision & Info Technologies\n'),
(19, 'ECO', 'Economics\n'),
(20, 'EDU', 'Education\n'),
(21, 'ECE', 'Electrical & Computer Engr\n'),
(22, 'EGR', 'Engineering\n'),
(23, 'EGEN', 'Engineering Entrepreneurship\n'),
(24, 'ENG', 'English\n'),
(25, 'ENT', 'Entrepreneurship Management\n'),
(26, 'ETH', 'Ethics\n'),
(27, 'EMB', 'Executive MBA\n'),
(28, 'FIN', 'Finance\n'),
(29, 'FRE', 'French\n'),
(30, 'GWS', 'Gender and Women''s Studies\n'),
(31, 'GEV', 'Geography and the Environment\n'),
(32, 'GLY', 'Geology\n'),
(33, 'GER', 'German\n'),
(34, 'GIS', 'Global Interdisc Studies\n'),
(35, 'GRK', 'Greek\n'),
(36, 'HBW', 'Hebrew\n'),
(37, 'HIS', 'History\n'),
(38, 'HON', 'Honors\n'),
(39, 'HRD', 'Human Resource Development\n'),
(40, 'HS', 'Human Services\n'),
(41, 'HUM', 'Humanities\n'),
(42, 'ITA', 'Italian\n'),
(43, 'JPN', 'Japanese\n'),
(44, 'LAT', 'Latin\n'),
(45, 'LAS', 'Latin American Studies\n'),
(46, 'LAW', 'Law\n'),
(47, 'LDR', 'Leadership\n'),
(48, 'LA', 'Liberal Arts\n'),
(49, 'LST', 'Liberal Studies\n'),
(50, 'MGT', 'Management\n'),
(51, 'MIS', 'Management Information Systems\n'),
(52, 'MKT', 'Marketing\n'),
(53, 'MAC', 'Master in Accounting/Prof Cons\n'),
(54, 'MSF', 'Master of Science in Finance\n'),
(55, 'MBA', 'Masters of Business Administra\n'),
(56, 'MAT', 'Mathematics\n'),
(57, 'ME', 'Mechanical Engineering\n'),
(58, 'MET', 'Meteorology\n'),
(59, 'MS', 'Military Science\n'),
(60, 'ML', 'Modern Languages & Literature\n'),
(61, 'NS', 'Naval Science\n'),
(62, 'NUR', 'Nursing\n'),
(63, 'NTR', 'Nutrition\n'),
(64, 'PJ', 'Peace & Justice\n'),
(65, 'PHI', 'Philosophy\n'),
(66, 'PHY', 'Physics\n'),
(67, 'PSC', 'Political Science\n'),
(68, 'POR', 'Portuguese\n'),
(69, 'ASPD', 'Prof Develop for AR & SC\n'),
(70, 'PSY', 'Psychology\n'),
(71, 'MPA', 'Public Administration\n'),
(72, 'RES', 'Real Estate\n'),
(73, 'EDR', 'Rosemont Elementary Education\n'),
(74, 'RUS', 'Russian\n'),
(75, 'VSB', 'School of Business\n'),
(76, 'SL', 'Service Learning\n'),
(77, 'SOC', 'Sociology\n'),
(78, 'SPA', 'Spanish\n'),
(79, 'SAR', 'Studio Art and Music\n'),
(80, 'VAB', 'Study Abroad\n'),
(81, 'LTX', 'Taxation\n'),
(82, 'THE', 'Theatre\n'),
(83, 'THL', 'Theology & Religious Studies\n'),
(84, 'VEXP', 'Villanova Experience\n'),
(85, 'AIS', 'Arab & Islamic Studies\n'),
(86, 'CGS', 'Cognitive Science\n'),
(87, 'SCI', 'Comprehensive Science\n'),
(88, 'CST', 'Cultural Studies\n'),
(89, 'MSE', 'Mendel Science Experience\n'),
(90, 'SCSC', 'Social Science\n'),
(91, 'ASL', 'American Sign Language\n'),
(92, 'HIN', 'Hindustani\n');

--
-- Dumping data for table `people`
--

INSERT INTO `people` (`id`, `email`, `firstname`, `lastname`, `viewed_message`, `admin`, `version`, `state`, `secret`, `salt`, `password`) VALUES
(1, 'apalko01@villanova.edu', 'Alex', 'Palkovic', 1, 1, 4, NULL, NULL, NULL, NULL);

--
-- Dumping data for table `requirements`
--

INSERT INTO `requirements` (`id`, `rtype`, `name`) VALUES
(1, NULL, 'Writing Enriched'),
(2, NULL, 'Writing Intensive'),
(3, NULL, 'Fine Arts'),
(4, NULL, 'Diversity One'),
(5, NULL, 'Diversity Two'),
(6, NULL, 'Diversity Three'),
(7, NULL, 'Arab Islamic Studies'),
(8, NULL, 'Africana Studies'),
(9, NULL, 'Peace and Justice'),
(10, NULL, 'Gender and Women''s Studies'),
(11, NULL, 'Advanced Literature'),
(12, NULL, 'Advanced History'),
(13, NULL, 'Advanced Theology'),
(14, NULL, 'Advanced Philosophy');

--
-- Dumping data for table `terms`
--

INSERT INTO `terms` (`id`, `termid`, `code`, `year`, `semester`, `start_date`, `end_date`, `active`) VALUES
(1, 'F10', '201120', '2010', 'Fall', '2010-09-01', '2010-12-31', 0),
(3, 'S11', '201130', '2011', 'Spring', '2011-01-01', '2011-08-31', 0),
(6, 'F12', '201220', '2011', 'Fall', '2011-09-01', '2011-12-31', 0);
