--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: appointment_appointmentlocation_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_appointmentlocation_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.appointment_appointmentlocation_enum OWNER TO postgres;

--
-- Name: appointment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status_enum AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
);


ALTER TYPE public.appointment_status_enum OWNER TO postgres;

--
-- Name: blog_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.blog_status_enum AS ENUM (
    'draft',
    'pending_review',
    'needs_revision',
    'rejected',
    'approved',
    'published',
    'archived'
);


ALTER TYPE public.blog_status_enum OWNER TO postgres;

--
-- Name: consultant_availability_location_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_availability_location_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.consultant_availability_location_enum OWNER TO postgres;

--
-- Name: consultant_profile_consultationtypes_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_profile_consultationtypes_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.consultant_profile_consultationtypes_enum OWNER TO postgres;

--
-- Name: consultant_profile_profilestatus_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_profile_profilestatus_enum AS ENUM (
    'active',
    'on_leave',
    'training',
    'inactive'
);


ALTER TYPE public.consultant_profile_profilestatus_enum OWNER TO postgres;

--
-- Name: contraceptive_reminder_frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contraceptive_reminder_frequency_enum AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE public.contraceptive_reminder_frequency_enum OWNER TO postgres;

--
-- Name: contraceptive_reminder_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contraceptive_reminder_status_enum AS ENUM (
    'active',
    'paused',
    'completed'
);


ALTER TYPE public.contraceptive_reminder_status_enum OWNER TO postgres;

--
-- Name: employment_contract_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_contract_status_enum AS ENUM (
    'pending',
    'active',
    'expired',
    'terminated',
    'renewed'
);


ALTER TYPE public.employment_contract_status_enum OWNER TO postgres;

--
-- Name: notification_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_priority_enum AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.notification_priority_enum OWNER TO postgres;

--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- Name: question_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_status_enum AS ENUM (
    'pending',
    'answered',
    'resolved',
    'closed'
);


ALTER TYPE public.question_status_enum OWNER TO postgres;

--
-- Name: role_name_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_name_enum AS ENUM (
    'customer',
    'consultant',
    'staff',
    'manager',
    'admin'
);


ALTER TYPE public.role_name_enum OWNER TO postgres;

--
-- Name: user_gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_gender_enum AS ENUM (
    'M',
    'F',
    'O'
);


ALTER TYPE public.user_gender_enum OWNER TO postgres;

--
-- Name: user_package_subscription_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_package_subscription_status_enum AS ENUM (
    'active',
    'expired',
    'cancelled',
    'suspended'
);


ALTER TYPE public.user_package_subscription_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    "isAccepted" boolean DEFAULT false NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    downvotes integer DEFAULT 0 NOT NULL,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "questionId" uuid,
    "consultantId" uuid
);


ALTER TABLE public.answer OWNER TO postgres;

--
-- Name: appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "appointmentDate" timestamp with time zone NOT NULL,
    status public.appointment_status_enum DEFAULT 'pending'::public.appointment_status_enum NOT NULL,
    notes text,
    "meetingLink" character varying(255),
    "reminderSent" boolean DEFAULT false NOT NULL,
    "reminderSentAt" timestamp with time zone,
    "checkInTime" timestamp with time zone,
    "checkOutTime" timestamp with time zone,
    "fixedPrice" numeric(10,2) NOT NULL,
    "consultantSelectionType" character varying(20) DEFAULT 'system'::character varying NOT NULL,
    "appointmentLocation" public.appointment_appointmentlocation_enum DEFAULT 'office'::public.appointment_appointmentlocation_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "userId" uuid,
    "consultantId" uuid,
    "consultantAvailabilityId" uuid
);


ALTER TABLE public.appointment OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    action character varying(50) NOT NULL,
    "entityType" character varying(50) NOT NULL,
    "entityId" uuid,
    "oldValues" jsonb,
    "newValues" jsonb,
    "userAgent" text,
    details text,
    status character varying(20) DEFAULT 'success'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: blog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    status public.blog_status_enum DEFAULT 'draft'::public.blog_status_enum NOT NULL,
    "featuredImage" character varying(1024),
    tags text[],
    views integer DEFAULT 0 NOT NULL,
    "seoTitle" character varying(255),
    "seoDescription" text,
    excerpt text,
    "readTime" integer,
    "reviewDate" timestamp with time zone,
    "rejectionReason" text,
    "revisionNotes" text,
    "publishedAt" timestamp with time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "authorId" uuid,
    "categoryId" uuid,
    "reviewedByUserId" uuid,
    "publishedByUserId" uuid
);


ALTER TABLE public.blog OWNER TO postgres;

--
-- Name: blog_services_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_services_service (
    "blogId" uuid NOT NULL,
    "serviceId" uuid NOT NULL
);


ALTER TABLE public.blog_services_service OWNER TO postgres;

--
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "parentId" uuid
);


ALTER TABLE public.category OWNER TO postgres;

--
-- Name: category_closure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category_closure (
    id_ancestor uuid NOT NULL,
    id_descendant uuid NOT NULL
);


ALTER TABLE public.category_closure OWNER TO postgres;

--
-- Name: consultant_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_availability (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "consultantId" character varying NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endTime" time without time zone NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "maxAppointments" integer DEFAULT 1 NOT NULL,
    location public.consultant_availability_location_enum,
    recurring boolean DEFAULT true NOT NULL,
    "specificDate" date,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "consultantProfileId" uuid NOT NULL
);


ALTER TABLE public.consultant_availability OWNER TO postgres;

--
-- Name: consultant_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_profile (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    specialization character varying(255) NOT NULL,
    qualification text NOT NULL,
    experience text NOT NULL,
    bio text,
    "workingHours" jsonb,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "profileStatus" public.consultant_profile_profilestatus_enum DEFAULT 'active'::public.consultant_profile_profilestatus_enum NOT NULL,
    certificates jsonb,
    languages text[],
    "educationBackground" text,
    "consultationFee" numeric(10,2) NOT NULL,
    "maxAppointmentsPerDay" integer DEFAULT 10 NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verifiedById" uuid,
    "verifiedAt" timestamp with time zone,
    "consultationTypes" public.consultant_profile_consultationtypes_enum[] DEFAULT '{office}'::public.consultant_profile_consultationtypes_enum[] NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.consultant_profile OWNER TO postgres;

--
-- Name: contraceptive_reminder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contraceptive_reminder (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "contraceptiveType" character varying(100) NOT NULL,
    "reminderTime" time without time zone NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    frequency public.contraceptive_reminder_frequency_enum DEFAULT 'daily'::public.contraceptive_reminder_frequency_enum NOT NULL,
    status public.contraceptive_reminder_status_enum DEFAULT 'active'::public.contraceptive_reminder_status_enum NOT NULL,
    "daysOfWeek" integer[],
    "reminderMessage" text,
    "snoozeCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.contraceptive_reminder OWNER TO postgres;

--
-- Name: contract_file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_file (
    "contractId" uuid NOT NULL,
    "fileId" uuid NOT NULL,
    "fileType" character varying(50),
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contract_file OWNER TO postgres;

--
-- Name: cycle_mood; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_mood (
    "cycleId" uuid NOT NULL,
    "moodId" uuid NOT NULL,
    intensity integer,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cycle_mood OWNER TO postgres;

--
-- Name: cycle_symptom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_symptom (
    "cycleId" uuid NOT NULL,
    "symptomId" uuid NOT NULL,
    intensity integer,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cycle_symptom OWNER TO postgres;

--
-- Name: document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    "originalName" character varying(255) NOT NULL,
    "mimeType" character varying(100) NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    description text,
    "documentType" character varying(50),
    "entityType" character varying(50),
    "entityId" uuid,
    "isPublic" boolean DEFAULT false NOT NULL,
    "isSensitive" boolean DEFAULT false NOT NULL,
    "userId" uuid,
    hash character varying(64),
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.document OWNER TO postgres;

--
-- Name: employment_contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_contract (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "contractNumber" character varying(50) NOT NULL,
    "contractType" character varying(50) NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    status public.employment_contract_status_enum DEFAULT 'pending'::public.employment_contract_status_enum NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.employment_contract OWNER TO postgres;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "serviceId" uuid,
    "appointmentId" uuid,
    "consultantId" uuid,
    rating integer NOT NULL,
    comment text,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "staffResponse" text,
    categories text[],
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    "originalName" character varying(255) NOT NULL,
    size integer NOT NULL,
    width integer,
    height integer,
    format character varying(10),
    "altText" character varying(255),
    "entityType" character varying(50),
    "entityId" uuid,
    "isPublic" boolean DEFAULT false NOT NULL,
    "userId" uuid,
    url text DEFAULT ''::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.image OWNER TO postgres;

--
-- Name: menstrual_cycle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menstrual_cycle (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "cycleStartDate" date NOT NULL,
    "cycleEndDate" date,
    "cycleLength" integer,
    "periodLength" integer,
    symptoms text[],
    notes text,
    "flowIntensity" integer,
    mood text[],
    "painLevel" integer,
    "medicationTaken" text[],
    temperature numeric(4,1),
    weight numeric(5,2),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.menstrual_cycle OWNER TO postgres;

--
-- Name: menstrual_prediction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menstrual_prediction (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "predictedCycleStart" date NOT NULL,
    "predictedCycleEnd" date NOT NULL,
    "predictedFertileStart" date NOT NULL,
    "predictedFertileEnd" date NOT NULL,
    "predictedOvulationDate" date NOT NULL,
    "predictionAccuracy" numeric(4,2),
    "notificationSent" boolean DEFAULT false NOT NULL,
    "notificationSentAt" timestamp with time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menstrual_prediction OWNER TO postgres;

--
-- Name: mood; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mood (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mood OWNER TO postgres;

--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(50) NOT NULL,
    "referenceId" uuid,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp with time zone,
    "actionUrl" text,
    priority public.notification_priority_enum,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: package_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_service (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "packageId" uuid NOT NULL,
    "serviceId" uuid NOT NULL,
    "quantityLimit" integer,
    "discountPercentage" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.package_service OWNER TO postgres;

--
-- Name: package_service_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_service_usage (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "subscriptionId" uuid NOT NULL,
    "serviceId" uuid NOT NULL,
    "appointmentId" uuid,
    "usageDate" date DEFAULT ('now'::text)::date NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.package_service_usage OWNER TO postgres;

--
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "appointmentId" uuid,
    amount numeric(10,2) NOT NULL,
    "paymentMethod" character varying(50) NOT NULL,
    status public.payment_status_enum DEFAULT 'pending'::public.payment_status_enum NOT NULL,
    "transactionId" character varying(255),
    "paymentDate" timestamp with time zone,
    "gatewayResponse" jsonb,
    refunded boolean DEFAULT false NOT NULL,
    "refundAmount" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "refundReason" text,
    "invoiceNumber" character varying(50),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    status public.question_status_enum NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "userId" uuid,
    "categoryId" uuid
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Name: question_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_tag (
    "questionId" uuid NOT NULL,
    "tagId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.question_tag OWNER TO postgres;

--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name public.role_name_enum DEFAULT 'customer'::public.role_name_enum NOT NULL,
    description character varying(60),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    images text[],
    "shortDescription" character varying(255),
    prerequisites text,
    "postInstructions" text,
    featured boolean DEFAULT false NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "categoryId" uuid
);


ALTER TABLE public.service OWNER TO postgres;

--
-- Name: service_appointments_appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_appointments_appointment (
    "serviceId" uuid NOT NULL,
    "appointmentId" uuid NOT NULL
);


ALTER TABLE public.service_appointments_appointment OWNER TO postgres;

--
-- Name: service_package; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_package (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    "durationMonths" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "maxServicesPerMonth" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.service_package OWNER TO postgres;

--
-- Name: symptom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.symptom (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "categoryId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.symptom OWNER TO postgres;

--
-- Name: tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tag OWNER TO postgres;

--
-- Name: test_result; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_result (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "appointmentId" uuid,
    "staffId" uuid,
    "resultData" jsonb NOT NULL,
    "resultSummary" text,
    "isAbnormal" boolean DEFAULT false NOT NULL,
    recommendation text,
    "viewedAt" timestamp with time zone,
    "notificationSent" boolean DEFAULT false NOT NULL,
    "fileUploads" text[],
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "followUpNotes" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.test_result OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(60) NOT NULL,
    password character varying(60),
    slug character varying(255) NOT NULL,
    "dateOfBirth" date,
    gender public.user_gender_enum,
    phone character varying(20),
    address text,
    "profilePicture" character varying(1024),
    "isActive" boolean DEFAULT true NOT NULL,
    "accountLockedUntil" timestamp with time zone,
    "loginAttempts" integer DEFAULT 0 NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationToken" character varying(255),
    "emailVerificationExpires" timestamp with time zone,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    "passwordResetToken" character varying(255),
    "passwordResetExpires" timestamp with time zone,
    "lastLogin" timestamp with time zone,
    locale character varying(10) DEFAULT 'vi'::character varying NOT NULL,
    "notificationPreferences" jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb NOT NULL,
    "healthDataConsent" boolean DEFAULT false NOT NULL,
    "refreshToken" character varying(255),
    version integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone,
    "roleId" uuid,
    "googleId" character varying,
    "deletedByUserId" character varying,
    "firstName" character varying(255) NOT NULL,
    "lastName" character varying(255) NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_package_subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_package_subscription (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "packageId" uuid NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    status public.user_package_subscription_status_enum DEFAULT 'active'::public.user_package_subscription_status_enum NOT NULL,
    "autoRenew" boolean DEFAULT false NOT NULL,
    "paymentId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


ALTER TABLE public.user_package_subscription OWNER TO postgres;

--
-- Name: audit_log PK_07fefa57f7f5ab8fc3f52b3ed0b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY (id);


--
-- Name: cycle_symptom PK_0e575cd5a581235472582e96b7a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptom
    ADD CONSTRAINT "PK_0e575cd5a581235472582e96b7a" PRIMARY KEY ("cycleId", "symptomId");


--
-- Name: service_package PK_1275e8aa6ef5b9cd78906ea53d3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_package
    ADD CONSTRAINT "PK_1275e8aa6ef5b9cd78906ea53d3" PRIMARY KEY (id);


--
-- Name: package_service_usage PK_213275fd027dab73765cf5803d8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "PK_213275fd027dab73765cf5803d8" PRIMARY KEY (id);


--
-- Name: question PK_21e5786aa0ea704ae185a79b2d5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY (id);


--
-- Name: user_package_subscription PK_306cd23b83a635470c9362d2d9d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscription
    ADD CONSTRAINT "PK_306cd23b83a635470c9362d2d9d" PRIMARY KEY (id);


--
-- Name: blog_services_service PK_4ffb4a9cace3bc5fbd8c4bf086d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_services_service
    ADD CONSTRAINT "PK_4ffb4a9cace3bc5fbd8c4bf086d" PRIMARY KEY ("blogId", "serviceId");


--
-- Name: question_tag PK_5c0fd8f9c38b89d1ddf6386ad7e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tag
    ADD CONSTRAINT "PK_5c0fd8f9c38b89d1ddf6386ad7e" PRIMARY KEY ("questionId", "tagId");


--
-- Name: menstrual_prediction PK_65da5185b17525d572977f0d0c4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_prediction
    ADD CONSTRAINT "PK_65da5185b17525d572977f0d0c4" PRIMARY KEY (id);


--
-- Name: menstrual_cycle PK_6e443e9fc5dd77f7eef62d581d3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycle
    ADD CONSTRAINT "PK_6e443e9fc5dd77f7eef62d581d3" PRIMARY KEY (id);


--
-- Name: notification PK_705b6c7cdf9b2c2ff7ac7872cb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY (id);


--
-- Name: consultant_availability PK_723fc91c26207da3069526ad72c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT "PK_723fc91c26207da3069526ad72c" PRIMARY KEY (id);


--
-- Name: feedback PK_8389f9e087a57689cd5be8b2b13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY (id);


--
-- Name: service PK_85a21558c006647cd76fdce044b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY (id);


--
-- Name: blog PK_85c6532ad065a448e9de7638571; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY (id);


--
-- Name: consultant_profile PK_8712fbdbc3d21e59aa0f9c83a66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profile
    ADD CONSTRAINT "PK_8712fbdbc3d21e59aa0f9c83a66" PRIMARY KEY (id);


--
-- Name: category_closure PK_8da8666fc72217687e9b4f4c7e9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_closure
    ADD CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY (id_ancestor, id_descendant);


--
-- Name: tag PK_8e4052373c579afc1471f526760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY (id);


--
-- Name: answer PK_9232db17b63fb1e94f97e5c224f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer
    ADD CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY (id);


--
-- Name: test_result PK_95770fb76248f4c3def5de11a72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_result
    ADD CONSTRAINT "PK_95770fb76248f4c3def5de11a72" PRIMARY KEY (id);


--
-- Name: package_service PK_97b66fb9670708eaf8be58025af; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service
    ADD CONSTRAINT "PK_97b66fb9670708eaf8be58025af" PRIMARY KEY (id);


--
-- Name: category PK_9c4e4a89e3674fc9f382d733f03; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY (id);


--
-- Name: cycle_mood PK_a1321b0491c9928ed411d6b2236; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_mood
    ADD CONSTRAINT "PK_a1321b0491c9928ed411d6b2236" PRIMARY KEY ("cycleId", "moodId");


--
-- Name: service_appointments_appointment PK_a6c98ff64002a1f0b0b740269c2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_appointments_appointment
    ADD CONSTRAINT "PK_a6c98ff64002a1f0b0b740269c2" PRIMARY KEY ("serviceId", "appointmentId");


--
-- Name: contraceptive_reminder PK_a9e167ecc62c22086b0aff54998; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminder
    ADD CONSTRAINT "PK_a9e167ecc62c22086b0aff54998" PRIMARY KEY (id);


--
-- Name: contract_file PK_af644490ed9e8bf9f9183bb8094; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_file
    ADD CONSTRAINT "PK_af644490ed9e8bf9f9183bb8094" PRIMARY KEY ("contractId", "fileId");


--
-- Name: role PK_b36bcfe02fc8de3c57a8b2391c2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY (id);


--
-- Name: employment_contract PK_bdc515ec3e40265dafed67c3465; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contract
    ADD CONSTRAINT "PK_bdc515ec3e40265dafed67c3465" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: mood PK_cd069bf46deedf0ef3a7771f44b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood
    ADD CONSTRAINT "PK_cd069bf46deedf0ef3a7771f44b" PRIMARY KEY (id);


--
-- Name: image PK_d6db1ab4ee9ad9dbe86c64e4cc3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY (id);


--
-- Name: document PK_e57d3357f83f3cdc0acffc3d777; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY (id);


--
-- Name: symptom PK_e6bf8581852864d312308633007; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptom
    ADD CONSTRAINT "PK_e6bf8581852864d312308633007" PRIMARY KEY (id);


--
-- Name: appointment PK_e8be1a53027415e709ce8a2db74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY (id);


--
-- Name: payment PK_fcaec7df5adf9cac408c686b2ab; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY (id);


--
-- Name: consultant_profile REL_08d5b25f3703cad3795a5ca7ae; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profile
    ADD CONSTRAINT "REL_08d5b25f3703cad3795a5ca7ae" UNIQUE ("userId");


--
-- Name: blog UQ_0dc7e58d73a1390874a663bd599; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "UQ_0dc7e58d73a1390874a663bd599" UNIQUE (slug);


--
-- Name: service_package UQ_1eb0aa60554c4a3d41aca285072; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_package
    ADD CONSTRAINT "UQ_1eb0aa60554c4a3d41aca285072" UNIQUE (slug);


--
-- Name: tag UQ_3413aed3ecde54f832c4f44f045; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT "UQ_3413aed3ecde54f832c4f44f045" UNIQUE (slug);


--
-- Name: service UQ_4df47ef659e04d5be78ddb6b598; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT "UQ_4df47ef659e04d5be78ddb6b598" UNIQUE (slug);


--
-- Name: user UQ_8e1f623798118e629b46a9e6299; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE (phone);


--
-- Name: user UQ_ac08b39ccb744ea6682c0db1c2d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_ac08b39ccb744ea6682c0db1c2d" UNIQUE (slug);


--
-- Name: category UQ_cb73208f151aa71cdd78f662d70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE (slug);


--
-- Name: question UQ_d9d2b5a007854ecda23c6cbb8ac; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT "UQ_d9d2b5a007854ecda23c6cbb8ac" UNIQUE (slug);


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: IDX_08d5b25f3703cad3795a5ca7ae; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_08d5b25f3703cad3795a5ca7ae" ON public.consultant_profile USING btree ("userId");


--
-- Name: IDX_0aaa1e346f9e3738330e266d8a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0aaa1e346f9e3738330e266d8a" ON public.consultant_profile USING btree ("profileStatus");


--
-- Name: IDX_0c8f6c6cc3ef2e4aa59b850636; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0c8f6c6cc3ef2e4aa59b850636" ON public.feedback USING btree ("deletedAt");


--
-- Name: IDX_0dc7e58d73a1390874a663bd59; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_0dc7e58d73a1390874a663bd59" ON public.blog USING btree (slug);


--
-- Name: IDX_16361129ad0359b4b5bd65b366; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_16361129ad0359b4b5bd65b366" ON public.blog_services_service USING btree ("serviceId");


--
-- Name: IDX_166b48db0aac03f682a638c324; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_166b48db0aac03f682a638c324" ON public.cycle_symptom USING btree ("symptomId");


--
-- Name: IDX_17d9278b8f51e5ee4c6ce2aba3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_17d9278b8f51e5ee4c6ce2aba3" ON public.cycle_symptom USING btree ("cycleId");


--
-- Name: IDX_1a69e7bbff22ccbe0e4b53c6ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_1a69e7bbff22ccbe0e4b53c6ef" ON public.feedback USING btree ("serviceId");


--
-- Name: IDX_1a9c3c722859b16ce34a419581; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_1a9c3c722859b16ce34a419581" ON public.menstrual_cycle USING btree ("userId");


--
-- Name: IDX_23c05c292c439d77b0de816b50; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_23c05c292c439d77b0de816b50" ON public.category USING btree (name);


--
-- Name: IDX_25357b4805ad5be50eb2f670b6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_25357b4805ad5be50eb2f670b6" ON public.contraceptive_reminder USING btree ("deletedAt");


--
-- Name: IDX_2c78b579975a920ceb398c0d33; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2c78b579975a920ceb398c0d33" ON public.answer USING btree ("isAccepted");


--
-- Name: IDX_2fb182292ee62dc52c3320ae5f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2fb182292ee62dc52c3320ae5f" ON public.cycle_mood USING btree ("moodId");


--
-- Name: IDX_470355432cc67b2c470c30bef7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_470355432cc67b2c470c30bef7" ON public."user" USING btree ("googleId");


--
-- Name: IDX_489220bf85b9a83c9c482ba6ca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_489220bf85b9a83c9c482ba6ca" ON public.consultant_availability USING btree ("isAvailable");


--
-- Name: IDX_493b116fd1ca369b57ea9675ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_493b116fd1ca369b57ea9675ef" ON public.appointment USING btree (status);


--
-- Name: IDX_4a39e6ac0cecdf18307a365cf3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4a39e6ac0cecdf18307a365cf3" ON public.feedback USING btree ("userId");


--
-- Name: IDX_4aa1348fc4b7da9bef0fae8ff4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON public.category_closure USING btree (id_ancestor);


--
-- Name: IDX_4dfe013cfaa9f2204471acb848; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4dfe013cfaa9f2204471acb848" ON public.employment_contract USING btree ("deletedAt");


--
-- Name: IDX_58e4dbff0e1a32a9bdc861bb29; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON public."user" USING btree ("firstName");


--
-- Name: IDX_63ad76a14a8321d22dc0a5e704; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_63ad76a14a8321d22dc0a5e704" ON public.category USING btree (type);


--
-- Name: IDX_6a22002acac4976977b1efd114; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON public.category_closure USING btree (id_descendant);


--
-- Name: IDX_6f10e2b187ccd50df6aebc2c82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_6f10e2b187ccd50df6aebc2c82" ON public.document USING btree ("documentType");


--
-- Name: IDX_7424ddcbdf1e9b067669eb0d3f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_7424ddcbdf1e9b067669eb0d3f" ON public.document USING btree ("userId");


--
-- Name: IDX_78e013ffae12f5a1fc1dbefff9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_78e013ffae12f5a1fc1dbefff9" ON public.audit_log USING btree ("createdAt");


--
-- Name: IDX_804e3df73019dcaefc0ef54c9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_804e3df73019dcaefc0ef54c9c" ON public.employment_contract USING btree (status);


--
-- Name: IDX_8c1e932f83c5d21826e325f255; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8c1e932f83c5d21826e325f255" ON public.contraceptive_reminder USING btree ("startDate");


--
-- Name: IDX_8cbe17b82f525e36980b3bad1f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8cbe17b82f525e36980b3bad1f" ON public.blog_services_service USING btree ("blogId");


--
-- Name: IDX_8e1f623798118e629b46a9e629; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_8e1f623798118e629b46a9e629" ON public."user" USING btree (phone);


--
-- Name: IDX_951e6339a77994dfbad976b35c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_951e6339a77994dfbad976b35c" ON public.audit_log USING btree (action);


--
-- Name: IDX_95a9d5cb46ec64893d2b5b2a82; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_95a9d5cb46ec64893d2b5b2a82" ON public.consultant_profile USING btree (rating);


--
-- Name: IDX_9666b0b3cea2a066682a344db4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_9666b0b3cea2a066682a344db4" ON public.appointment USING btree ("appointmentLocation");


--
-- Name: IDX_a073d52bed673ca494c724777c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_a073d52bed673ca494c724777c" ON public.consultant_profile USING btree ("deletedAt");


--
-- Name: IDX_aa8e0255c9f9829941da1de514; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_aa8e0255c9f9829941da1de514" ON public.consultant_availability USING btree ("dayOfWeek");


--
-- Name: IDX_ac08b39ccb744ea6682c0db1c2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ac08b39ccb744ea6682c0db1c2" ON public."user" USING btree (slug);


--
-- Name: IDX_b11dc66862d2365740672b3d0c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b11dc66862d2365740672b3d0c" ON public.answer USING btree ("deletedAt");


--
-- Name: IDX_b13eed2777335a3d24d4eadc68; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b13eed2777335a3d24d4eadc68" ON public.feedback USING btree ("consultantId");


--
-- Name: IDX_b23f299cbf9e6d77a134202eea; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b23f299cbf9e6d77a134202eea" ON public.consultant_profile USING btree (specialization);


--
-- Name: IDX_b8d88dc8e1c041bd2138d2f082; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b8d88dc8e1c041bd2138d2f082" ON public.contraceptive_reminder USING btree (status);


--
-- Name: IDX_c3ce16aaf8b8460746381316ba; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c3ce16aaf8b8460746381316ba" ON public.feedback USING btree ("appointmentId");


--
-- Name: IDX_c4cb463bdc3470ffa7880676fe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c4cb463bdc3470ffa7880676fe" ON public.blog USING btree ("deletedAt");


--
-- Name: IDX_ca798077a202f9f6ede55003ef; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ca798077a202f9f6ede55003ef" ON public.menstrual_cycle USING btree ("deletedAt");


--
-- Name: IDX_ca86cc23a4d19919ab17e80fed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ca86cc23a4d19919ab17e80fed" ON public.contraceptive_reminder USING btree ("userId");


--
-- Name: IDX_caed4e2d84036ff4fac08e3bf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_caed4e2d84036ff4fac08e3bf9" ON public.blog USING btree ("publishedAt");


--
-- Name: IDX_cb73208f151aa71cdd78f662d7; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cb73208f151aa71cdd78f662d7" ON public.category USING btree (slug);


--
-- Name: IDX_cd4c6508d97964b6cc4f6eb1fd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_cd4c6508d97964b6cc4f6eb1fd" ON public.service_appointments_appointment USING btree ("appointmentId");


--
-- Name: IDX_d1906f08da8a6fb40001f704e6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d1906f08da8a6fb40001f704e6" ON public.contract_file USING btree ("fileId");


--
-- Name: IDX_d2df47dfb84af9bb536d6d27af; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_d2df47dfb84af9bb536d6d27af" ON public.service_appointments_appointment USING btree ("serviceId");


--
-- Name: IDX_db313d4d79c1874d8808336905; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_db313d4d79c1874d8808336905" ON public.appointment USING btree ("appointmentDate");


--
-- Name: IDX_dc40417dfa0c7fbd70b8eb880c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_dc40417dfa0c7fbd70b8eb880c" ON public.image USING btree ("userId");


--
-- Name: IDX_dd171b09e0e3c8e7a31453b016; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_dd171b09e0e3c8e7a31453b016" ON public.feedback USING btree (rating);


--
-- Name: IDX_e12875dfb3b1d92d7d7c5377e2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON public."user" USING btree (email);


--
-- Name: IDX_e5e6db0ac1ad138efe6802fe3d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e5e6db0ac1ad138efe6802fe3d" ON public.cycle_mood USING btree ("cycleId");


--
-- Name: IDX_e6a23724df5bcc1847f708faf2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e6a23724df5bcc1847f708faf2" ON public.menstrual_cycle USING btree ("cycleStartDate");


--
-- Name: IDX_e831442301310cbb4afa35a893; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e831442301310cbb4afa35a893" ON public.contract_file USING btree ("contractId");


--
-- Name: IDX_e903925f141fd29fbdafcd479f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e903925f141fd29fbdafcd479f" ON public.consultant_availability USING btree ("consultantId");


--
-- Name: IDX_e9909b1356b38a12aa818c1016; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e9909b1356b38a12aa818c1016" ON public.appointment USING btree ("deletedAt");


--
-- Name: IDX_e9da73f0ea0d7f197aa7884e1a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e9da73f0ea0d7f197aa7884e1a" ON public.blog USING btree (status);


--
-- Name: IDX_f0e1b4ecdca13b177e2e3a0613; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON public."user" USING btree ("lastName");


--
-- Name: consultant_profile FK_08d5b25f3703cad3795a5ca7ae7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profile
    ADD CONSTRAINT "FK_08d5b25f3703cad3795a5ca7ae7" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: package_service FK_0a097ef4b3ef63168129d203484; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service
    ADD CONSTRAINT "FK_0a097ef4b3ef63168129d203484" FOREIGN KEY ("serviceId") REFERENCES public.service(id);


--
-- Name: employment_contract FK_110ddb02f636e5975c57e6092ea; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contract
    ADD CONSTRAINT "FK_110ddb02f636e5975c57e6092ea" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: test_result FK_14f01014305aefff592b0fdc815; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_result
    ADD CONSTRAINT "FK_14f01014305aefff592b0fdc815" FOREIGN KEY ("staffId") REFERENCES public."user"(id);


--
-- Name: blog_services_service FK_16361129ad0359b4b5bd65b366e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_services_service
    ADD CONSTRAINT "FK_16361129ad0359b4b5bd65b366e" FOREIGN KEY ("serviceId") REFERENCES public.service(id);


--
-- Name: cycle_symptom FK_166b48db0aac03f682a638c324c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptom
    ADD CONSTRAINT "FK_166b48db0aac03f682a638c324c" FOREIGN KEY ("symptomId") REFERENCES public.symptom(id);


--
-- Name: cycle_symptom FK_17d9278b8f51e5ee4c6ce2aba34; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptom
    ADD CONSTRAINT "FK_17d9278b8f51e5ee4c6ce2aba34" FOREIGN KEY ("cycleId") REFERENCES public.menstrual_cycle(id);


--
-- Name: feedback FK_1a69e7bbff22ccbe0e4b53c6ef7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "FK_1a69e7bbff22ccbe0e4b53c6ef7" FOREIGN KEY ("serviceId") REFERENCES public.service(id);


--
-- Name: menstrual_cycle FK_1a9c3c722859b16ce34a4195813; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycle
    ADD CONSTRAINT "FK_1a9c3c722859b16ce34a4195813" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: package_service_usage FK_1aa57594818356dd1b1ec196df2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_1aa57594818356dd1b1ec196df2" FOREIGN KEY ("appointmentId") REFERENCES public.appointment(id);


--
-- Name: notification FK_1ced25315eb974b73391fb1c81b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: package_service FK_250af10f9cc43a9f2208778e627; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service
    ADD CONSTRAINT "FK_250af10f9cc43a9f2208778e627" FOREIGN KEY ("packageId") REFERENCES public.service_package(id);


--
-- Name: blog FK_2585c11fedee21900a332b554a6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "FK_2585c11fedee21900a332b554a6" FOREIGN KEY ("categoryId") REFERENCES public.category(id);


--
-- Name: audit_log FK_2621409ebc295c5da7ff3e41396; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT "FK_2621409ebc295c5da7ff3e41396" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: appointment FK_2a990a304a43ccc7415bf7e3a99; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT "FK_2a990a304a43ccc7415bf7e3a99" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: answer FK_2f797a4a177bc765a6d5a554ddb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer
    ADD CONSTRAINT "FK_2f797a4a177bc765a6d5a554ddb" FOREIGN KEY ("consultantId") REFERENCES public.consultant_profile(id) ON DELETE CASCADE;


--
-- Name: cycle_mood FK_2fb182292ee62dc52c3320ae5f7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_mood
    ADD CONSTRAINT "FK_2fb182292ee62dc52c3320ae5f7" FOREIGN KEY ("moodId") REFERENCES public.mood(id);


--
-- Name: consultant_availability FK_379c9d6285055a8ac3269b19e73; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT "FK_379c9d6285055a8ac3269b19e73" FOREIGN KEY ("consultantProfileId") REFERENCES public.consultant_profile(id);


--
-- Name: menstrual_prediction FK_3910a895d70bb4dc70c4f80bd46; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_prediction
    ADD CONSTRAINT "FK_3910a895d70bb4dc70c4f80bd46" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: question_tag FK_404f26e7998f708595e3c800985; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tag
    ADD CONSTRAINT "FK_404f26e7998f708595e3c800985" FOREIGN KEY ("questionId") REFERENCES public.question(id);


--
-- Name: blog FK_48927b370f5cad70e86b6a57549; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "FK_48927b370f5cad70e86b6a57549" FOREIGN KEY ("publishedByUserId") REFERENCES public."user"(id);


--
-- Name: feedback FK_4a39e6ac0cecdf18307a365cf3c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "FK_4a39e6ac0cecdf18307a365cf3c" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: category_closure FK_4aa1348fc4b7da9bef0fae8ff48; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_closure
    ADD CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48" FOREIGN KEY (id_ancestor) REFERENCES public.category(id) ON DELETE CASCADE;


--
-- Name: user_package_subscription FK_5e14b618d2fa198d0bfc4e121ca; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscription
    ADD CONSTRAINT "FK_5e14b618d2fa198d0bfc4e121ca" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: payment FK_66d337cd623beab5f99244699b9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT "FK_66d337cd623beab5f99244699b9" FOREIGN KEY ("appointmentId") REFERENCES public.appointment(id);


--
-- Name: category_closure FK_6a22002acac4976977b1efd114a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category_closure
    ADD CONSTRAINT "FK_6a22002acac4976977b1efd114a" FOREIGN KEY (id_descendant) REFERENCES public.category(id) ON DELETE CASCADE;


--
-- Name: question_tag FK_6cec0f2e5d20028770ebd7e4dfe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tag
    ADD CONSTRAINT "FK_6cec0f2e5d20028770ebd7e4dfe" FOREIGN KEY ("tagId") REFERENCES public.tag(id);


--
-- Name: test_result FK_6cf5f3733f6bf8b110f668e3ecd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_result
    ADD CONSTRAINT "FK_6cf5f3733f6bf8b110f668e3ecd" FOREIGN KEY ("appointmentId") REFERENCES public.appointment(id) ON DELETE CASCADE;


--
-- Name: document FK_7424ddcbdf1e9b067669eb0d3fd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT "FK_7424ddcbdf1e9b067669eb0d3fd" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: question FK_80f29cc01d0bd1644e389cc13be; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT "FK_80f29cc01d0bd1644e389cc13be" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: package_service_usage FK_812050ff815af9c6102ffd0a991; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_812050ff815af9c6102ffd0a991" FOREIGN KEY ("subscriptionId") REFERENCES public.user_package_subscription(id);


--
-- Name: user_package_subscription FK_83c1da41f43f31337968d0f46bc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscription
    ADD CONSTRAINT "FK_83c1da41f43f31337968d0f46bc" FOREIGN KEY ("packageId") REFERENCES public.service_package(id);


--
-- Name: symptom FK_8663039204369ad863992137cfb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptom
    ADD CONSTRAINT "FK_8663039204369ad863992137cfb" FOREIGN KEY ("categoryId") REFERENCES public.category(id);


--
-- Name: appointment FK_8b0c009c9246d0fd6847a5fce11; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT "FK_8b0c009c9246d0fd6847a5fce11" FOREIGN KEY ("consultantAvailabilityId") REFERENCES public.consultant_availability(id);


--
-- Name: blog_services_service FK_8cbe17b82f525e36980b3bad1f1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_services_service
    ADD CONSTRAINT "FK_8cbe17b82f525e36980b3bad1f1" FOREIGN KEY ("blogId") REFERENCES public.blog(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blog FK_a001483d5ba65dad16557cd6ddb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "FK_a001483d5ba65dad16557cd6ddb" FOREIGN KEY ("authorId") REFERENCES public."user"(id);


--
-- Name: answer FK_a4013f10cd6924793fbd5f0d637; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer
    ADD CONSTRAINT "FK_a4013f10cd6924793fbd5f0d637" FOREIGN KEY ("questionId") REFERENCES public.question(id) ON DELETE CASCADE;


--
-- Name: payment FK_b046318e0b341a7f72110b75857; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT "FK_b046318e0b341a7f72110b75857" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: feedback FK_b13eed2777335a3d24d4eadc68b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "FK_b13eed2777335a3d24d4eadc68b" FOREIGN KEY ("consultantId") REFERENCES public."user"(id);


--
-- Name: question FK_b8dd754e373b56714ddfa8f545c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT "FK_b8dd754e373b56714ddfa8f545c" FOREIGN KEY ("categoryId") REFERENCES public.category(id);


--
-- Name: consultant_profile FK_bf8699c9a04a18f9d4b3ca171a6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profile
    ADD CONSTRAINT "FK_bf8699c9a04a18f9d4b3ca171a6" FOREIGN KEY ("verifiedById") REFERENCES public."user"(id);


--
-- Name: user FK_c28e52f758e7bbc53828db92194; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: feedback FK_c3ce16aaf8b8460746381316ba0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "FK_c3ce16aaf8b8460746381316ba0" FOREIGN KEY ("appointmentId") REFERENCES public.appointment(id);


--
-- Name: contraceptive_reminder FK_ca86cc23a4d19919ab17e80fedd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminder
    ADD CONSTRAINT "FK_ca86cc23a4d19919ab17e80fedd" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: service FK_cb169715cbb8c74f263ba192ca8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT "FK_cb169715cbb8c74f263ba192ca8" FOREIGN KEY ("categoryId") REFERENCES public.category(id);


--
-- Name: service_appointments_appointment FK_cd4c6508d97964b6cc4f6eb1fdc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_appointments_appointment
    ADD CONSTRAINT "FK_cd4c6508d97964b6cc4f6eb1fdc" FOREIGN KEY ("appointmentId") REFERENCES public.appointment(id);


--
-- Name: contract_file FK_d1906f08da8a6fb40001f704e6b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_file
    ADD CONSTRAINT "FK_d1906f08da8a6fb40001f704e6b" FOREIGN KEY ("fileId") REFERENCES public.document(id) ON DELETE CASCADE;


--
-- Name: service_appointments_appointment FK_d2df47dfb84af9bb536d6d27afd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_appointments_appointment
    ADD CONSTRAINT "FK_d2df47dfb84af9bb536d6d27afd" FOREIGN KEY ("serviceId") REFERENCES public.service(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category FK_d5456fd7e4c4866fec8ada1fa10; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10" FOREIGN KEY ("parentId") REFERENCES public.category(id);


--
-- Name: image FK_dc40417dfa0c7fbd70b8eb880cc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT "FK_dc40417dfa0c7fbd70b8eb880cc" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: cycle_mood FK_e5e6db0ac1ad138efe6802fe3dd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_mood
    ADD CONSTRAINT "FK_e5e6db0ac1ad138efe6802fe3dd" FOREIGN KEY ("cycleId") REFERENCES public.menstrual_cycle(id);


--
-- Name: blog FK_e7fad6d10608efc340693b1e8b8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog
    ADD CONSTRAINT "FK_e7fad6d10608efc340693b1e8b8" FOREIGN KEY ("reviewedByUserId") REFERENCES public."user"(id);


--
-- Name: contract_file FK_e831442301310cbb4afa35a893e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_file
    ADD CONSTRAINT "FK_e831442301310cbb4afa35a893e" FOREIGN KEY ("contractId") REFERENCES public.employment_contract(id) ON DELETE CASCADE;


--
-- Name: appointment FK_ef2efa13c414594ca1f0a63afcf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment
    ADD CONSTRAINT "FK_ef2efa13c414594ca1f0a63afcf" FOREIGN KEY ("consultantId") REFERENCES public."user"(id);


--
-- Name: user_package_subscription FK_fa4c818739f51a33c6f61ac30eb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscription
    ADD CONSTRAINT "FK_fa4c818739f51a33c6f61ac30eb" FOREIGN KEY ("paymentId") REFERENCES public.payment(id);


--
-- Name: package_service_usage FK_fe663fd36d9191673d1941dbaa7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_fe663fd36d9191673d1941dbaa7" FOREIGN KEY ("serviceId") REFERENCES public.service(id);


--
-- PostgreSQL database dump complete
--

