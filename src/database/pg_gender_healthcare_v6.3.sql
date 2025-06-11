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
-- Name: appointments_appointment_location_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointments_appointment_location_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.appointments_appointment_location_enum OWNER TO postgres;

--
-- Name: appointments_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointments_status_enum AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
);


ALTER TYPE public.appointments_status_enum OWNER TO postgres;

--
-- Name: blogs_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.blogs_status_enum AS ENUM (
    'draft',
    'pending_review',
    'needs_revision',
    'rejected',
    'approved',
    'published',
    'archived'
);


ALTER TYPE public.blogs_status_enum OWNER TO postgres;

--
-- Name: consultant_availability_location_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_availability_location_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.consultant_availability_location_enum OWNER TO postgres;

--
-- Name: consultant_profiles_consultation_types_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_profiles_consultation_types_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.consultant_profiles_consultation_types_enum OWNER TO postgres;

--
-- Name: consultant_profiles_profile_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultant_profiles_profile_status_enum AS ENUM (
    'active',
    'on_leave',
    'training',
    'inactive'
);


ALTER TYPE public.consultant_profiles_profile_status_enum OWNER TO postgres;

--
-- Name: contraceptive_reminders_frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contraceptive_reminders_frequency_enum AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE public.contraceptive_reminders_frequency_enum OWNER TO postgres;

--
-- Name: contraceptive_reminders_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contraceptive_reminders_status_enum AS ENUM (
    'active',
    'paused',
    'completed'
);


ALTER TYPE public.contraceptive_reminders_status_enum OWNER TO postgres;

--
-- Name: employment_contracts_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_contracts_status_enum AS ENUM (
    'pending',
    'active',
    'expired',
    'terminated',
    'renewed'
);


ALTER TYPE public.employment_contracts_status_enum OWNER TO postgres;

--
-- Name: notifications_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_priority_enum AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.notifications_priority_enum OWNER TO postgres;

--
-- Name: payments_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payments_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payments_status_enum OWNER TO postgres;

--
-- Name: questions_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.questions_status_enum AS ENUM (
    'pending',
    'answered',
    'closed'
);


ALTER TYPE public.questions_status_enum OWNER TO postgres;

--
-- Name: roles_name_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.roles_name_enum AS ENUM (
    'customer',
    'consultant',
    'staff',
    'manager',
    'admin'
);


ALTER TYPE public.roles_name_enum OWNER TO postgres;

--
-- Name: user_package_subscriptions_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_package_subscriptions_status_enum AS ENUM (
    'active',
    'expired',
    'cancelled',
    'suspended'
);


ALTER TYPE public.user_package_subscriptions_status_enum OWNER TO postgres;

--
-- Name: users_gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_gender_enum AS ENUM (
    'M',
    'F',
    'O'
);


ALTER TYPE public.users_gender_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_id uuid,
    consultant_id uuid,
    content text NOT NULL,
    is_accepted boolean DEFAULT false NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    downvotes integer DEFAULT 0 NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: appointment_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_services (
    appointment_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.appointment_services OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    consultant_id uuid,
    appointment_date timestamp with time zone NOT NULL,
    status public.appointments_status_enum DEFAULT 'pending'::public.appointments_status_enum NOT NULL,
    notes text,
    meeting_link character varying(255),
    reminder_sent boolean DEFAULT false NOT NULL,
    reminder_sent_at timestamp with time zone,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    fixed_price numeric(10,2) NOT NULL,
    consultant_selection_type character varying(20) DEFAULT 'system'::character varying NOT NULL,
    appointment_location public.appointments_appointment_location_enum DEFAULT 'office'::public.appointments_appointment_location_enum NOT NULL,
    availability_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    user_agent text,
    details text,
    status character varying(20) DEFAULT 'success'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: blog_service_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_service_relations (
    blog_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blog_service_relations OWNER TO postgres;

--
-- Name: blogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blogs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    author_id uuid,
    status public.blogs_status_enum DEFAULT 'draft'::public.blogs_status_enum NOT NULL,
    featured_image character varying(255),
    tags text[],
    views integer DEFAULT 0 NOT NULL,
    seo_title character varying(255),
    seo_description text,
    related_services uuid[],
    excerpt text,
    read_time integer,
    reviewed_by_id uuid,
    review_date timestamp with time zone,
    rejection_reason text,
    revision_notes text,
    published_by_id uuid,
    published_at timestamp with time zone,
    category_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.blogs OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    level integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    "parentId" uuid
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_closure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories_closure (
    id_ancestor uuid NOT NULL,
    id_descendant uuid NOT NULL,
    level integer NOT NULL
);


ALTER TABLE public.categories_closure OWNER TO postgres;

--
-- Name: consultant_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_availability (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    max_appointments integer DEFAULT 1 NOT NULL,
    location public.consultant_availability_location_enum,
    recurring boolean DEFAULT true NOT NULL,
    specific_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    consultant_id uuid NOT NULL
);


ALTER TABLE public.consultant_availability OWNER TO postgres;

--
-- Name: consultant_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    specialization character varying(255) NOT NULL,
    qualification text NOT NULL,
    experience text NOT NULL,
    bio text,
    working_hours jsonb,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    profile_status public.consultant_profiles_profile_status_enum DEFAULT 'active'::public.consultant_profiles_profile_status_enum NOT NULL,
    certificates jsonb,
    languages text[],
    education_background text,
    consultation_fee numeric(10,2) NOT NULL,
    max_appointments_per_day integer DEFAULT 10 NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verified_by_id uuid,
    verified_at timestamp with time zone,
    consultation_types public.consultant_profiles_consultation_types_enum[] DEFAULT '{office}'::public.consultant_profiles_consultation_types_enum[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.consultant_profiles OWNER TO postgres;

--
-- Name: contraceptive_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contraceptive_reminders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    contraceptive_type character varying(100) NOT NULL,
    reminder_time time without time zone NOT NULL,
    start_date date NOT NULL,
    end_date date,
    frequency public.contraceptive_reminders_frequency_enum DEFAULT 'daily'::public.contraceptive_reminders_frequency_enum NOT NULL,
    status public.contraceptive_reminders_status_enum DEFAULT 'active'::public.contraceptive_reminders_status_enum NOT NULL,
    days_of_week integer[],
    reminder_message text,
    snooze_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contraceptive_reminders OWNER TO postgres;

--
-- Name: contract_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_files (
    contract_id uuid NOT NULL,
    file_id uuid NOT NULL,
    file_type character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.contract_files OWNER TO postgres;

--
-- Name: cycle_moods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_moods (
    cycle_id uuid NOT NULL,
    mood_id uuid NOT NULL,
    intensity integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cycle_moods OWNER TO postgres;

--
-- Name: cycle_symptoms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_symptoms (
    cycle_id uuid NOT NULL,
    symptom_id uuid NOT NULL,
    intensity integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cycle_symptoms OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    description text,
    document_type character varying(50),
    entity_type character varying(50),
    entity_id uuid,
    is_public boolean DEFAULT false NOT NULL,
    is_sensitive boolean DEFAULT false NOT NULL,
    user_id uuid,
    hash character varying(64),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: employment_contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    contract_number character varying(50) NOT NULL,
    contract_type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status public.employment_contracts_status_enum DEFAULT 'pending'::public.employment_contracts_status_enum NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employment_contracts OWNER TO postgres;

--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedbacks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    service_id uuid,
    appointment_id uuid,
    consultant_id uuid,
    rating integer NOT NULL,
    comment text,
    is_anonymous boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    staff_response text,
    categories text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.feedbacks OWNER TO postgres;

--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    size integer NOT NULL,
    width integer,
    height integer,
    format character varying(10),
    alt_text character varying(255),
    entity_type character varying(50),
    entity_id uuid,
    is_public boolean DEFAULT false NOT NULL,
    user_id uuid,
    url text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.images OWNER TO postgres;

--
-- Name: menstrual_cycles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menstrual_cycles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    cycle_start_date date NOT NULL,
    cycle_end_date date,
    cycle_length integer,
    period_length integer,
    symptoms text[],
    notes text,
    flow_intensity integer,
    mood text[],
    pain_level integer,
    medication_taken text[],
    temperature numeric(4,1),
    weight numeric(5,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menstrual_cycles OWNER TO postgres;

--
-- Name: menstrual_predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menstrual_predictions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    predicted_cycle_start date NOT NULL,
    predicted_cycle_end date NOT NULL,
    predicted_fertile_start date NOT NULL,
    predicted_fertile_end date NOT NULL,
    predicted_ovulation_date date NOT NULL,
    prediction_accuracy numeric(4,2),
    notification_sent boolean DEFAULT false NOT NULL,
    notification_sent_at timestamp with time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menstrual_predictions OWNER TO postgres;

--
-- Name: moods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.moods OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(50) NOT NULL,
    reference_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    action_url text,
    priority public.notifications_priority_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: package_service_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_service_usage (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subscription_id uuid NOT NULL,
    service_id uuid NOT NULL,
    appointment_id uuid,
    usage_date date DEFAULT ('now'::text)::date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.package_service_usage OWNER TO postgres;

--
-- Name: package_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    package_id uuid NOT NULL,
    service_id uuid NOT NULL,
    quantity_limit integer,
    discount_percentage numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.package_services OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    appointment_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    status public.payments_status_enum DEFAULT 'pending'::public.payments_status_enum NOT NULL,
    transaction_id character varying(255),
    payment_date timestamp with time zone,
    gateway_response jsonb,
    refunded boolean DEFAULT false NOT NULL,
    refund_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    refund_reason text,
    invoice_number character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: question_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_tags (
    question_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.question_tags OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    status public.questions_status_enum NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    category_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name public.roles_name_enum DEFAULT 'customer'::public.roles_name_enum NOT NULL,
    description character varying(60),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: service_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_packages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration_months integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    max_services_per_month integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.service_packages OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    images text[],
    short_description character varying(255),
    prerequisites text,
    post_instructions text,
    featured boolean DEFAULT false NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    category_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.symptoms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.symptoms OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: test_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    appointment_id uuid,
    staff_id uuid,
    result_data jsonb NOT NULL,
    result_summary text,
    is_abnormal boolean DEFAULT false NOT NULL,
    recommendation text,
    viewed_at timestamp with time zone,
    notification_sent boolean DEFAULT false NOT NULL,
    file_uploads text[],
    follow_up_required boolean DEFAULT false NOT NULL,
    follow_up_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.test_results OWNER TO postgres;

--
-- Name: user_package_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_package_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    package_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.user_package_subscriptions_status_enum DEFAULT 'active'::public.user_package_subscriptions_status_enum NOT NULL,
    auto_renew boolean DEFAULT false NOT NULL,
    payment_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.user_package_subscriptions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(60) NOT NULL,
    password character varying(60) NOT NULL,
    full_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    date_of_birth date,
    gender public.users_gender_enum,
    phone character varying(20),
    address text,
    role_id uuid NOT NULL,
    profile_picture character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    account_locked_until timestamp with time zone,
    login_attempts integer DEFAULT 0 NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_token character varying(255),
    email_verification_expires timestamp with time zone,
    phone_verified boolean DEFAULT false NOT NULL,
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    last_login timestamp with time zone,
    locale character varying(10) DEFAULT 'vi'::character varying NOT NULL,
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb NOT NULL,
    health_data_consent boolean DEFAULT false NOT NULL,
    refresh_token character varying(255),
    version integer DEFAULT 0 NOT NULL,
    deleted_by_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: questions PK_08a6d4b0f49ff300bf3a0ca60ac; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY (id);


--
-- Name: package_services PK_0c19799a8fbfbc06701fe3b90fc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT "PK_0c19799a8fbfbc06701fe3b90fc" PRIMARY KEY (id);


--
-- Name: appointment_services PK_0d8cb48b88882567f9bd788b1a0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT "PK_0d8cb48b88882567f9bd788b1a0" PRIMARY KEY (appointment_id, service_id);


--
-- Name: employment_contracts PK_15928b5ec88cc7e0b2a6a2ff513; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contracts
    ADD CONSTRAINT "PK_15928b5ec88cc7e0b2a6a2ff513" PRIMARY KEY (id);


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: question_tags PK_1c7296b35b6f04f8a7c245cccdc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT "PK_1c7296b35b6f04f8a7c245cccdc" PRIMARY KEY (question_id, tag_id);


--
-- Name: images PK_1fe148074c6a1a91b63cb9ee3c9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT "PK_1fe148074c6a1a91b63cb9ee3c9" PRIMARY KEY (id);


--
-- Name: package_service_usage PK_213275fd027dab73765cf5803d8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "PK_213275fd027dab73765cf5803d8" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: contraceptive_reminders PK_28492c4b8bafa16f5b19eab2d4f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminders
    ADD CONSTRAINT "PK_28492c4b8bafa16f5b19eab2d4f" PRIMARY KEY (id);


--
-- Name: cycle_symptoms PK_2ed51e48148f1bba6268846b285; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT "PK_2ed51e48148f1bba6268846b285" PRIMARY KEY (cycle_id, symptom_id);


--
-- Name: user_package_subscriptions PK_411671c54c314015aaf17139b93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT "PK_411671c54c314015aaf17139b93" PRIMARY KEY (id);


--
-- Name: appointments PK_4a437a9a27e948726b8bb3e36ad; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY (id);


--
-- Name: moods PK_5e8d7a76ab84b2b527458490774; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moods
    ADD CONSTRAINT "PK_5e8d7a76ab84b2b527458490774" PRIMARY KEY (id);


--
-- Name: contract_files PK_694c7a8e90b417b42d5244190f0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT "PK_694c7a8e90b417b42d5244190f0" PRIMARY KEY (contract_id, file_id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: test_results PK_6af5df01fcd3971b362fc828296; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT "PK_6af5df01fcd3971b362fc828296" PRIMARY KEY (id);


--
-- Name: symptoms PK_7041f6c8f7afb75b9286c275a81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT "PK_7041f6c8f7afb75b9286c275a81" PRIMARY KEY (id);


--
-- Name: consultant_availability PK_723fc91c26207da3069526ad72c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT "PK_723fc91c26207da3069526ad72c" PRIMARY KEY (id);


--
-- Name: feedbacks PK_79affc530fdd838a9f1e0cc30be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY (id);


--
-- Name: cycle_moods PK_996f9bf65260a16bd9d4bb558e6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT "PK_996f9bf65260a16bd9d4bb558e6" PRIMARY KEY (cycle_id, mood_id);


--
-- Name: answers PK_9c32cec6c71e06da0254f2226c6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: documents PK_ac51aa5181ee2036f5ca482857c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY (id);


--
-- Name: services PK_ba2d347a3168a296416c6c5ccb2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY (id);


--
-- Name: menstrual_cycles PK_c0b80a10528581683a1b5f32f27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycles
    ADD CONSTRAINT "PK_c0b80a10528581683a1b5f32f27" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: service_packages PK_d602a30f23af1a0ecf7c8e994df; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_packages
    ADD CONSTRAINT "PK_d602a30f23af1a0ecf7c8e994df" PRIMARY KEY (id);


--
-- Name: categories_closure PK_dc67f6a82852c15ec6e4243398d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "PK_dc67f6a82852c15ec6e4243398d" PRIMARY KEY (id_ancestor, id_descendant);


--
-- Name: blogs PK_e113335f11c926da929a625f118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY (id);


--
-- Name: menstrual_predictions PK_e74e27bf47eab3f8e24cdda9401; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_predictions
    ADD CONSTRAINT "PK_e74e27bf47eab3f8e24cdda9401" PRIMARY KEY (id);


--
-- Name: tags PK_e7dc17249a1148a1970748eda99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY (id);


--
-- Name: consultant_profiles PK_f3d27d56702e6aac7ac965ae27a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT "PK_f3d27d56702e6aac7ac965ae27a" PRIMARY KEY (id);


--
-- Name: blog_service_relations PK_fe16f46f38031eb63878fa456fa; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT "PK_fe16f46f38031eb63878fa456fa" PRIMARY KEY (blog_id, service_id);


--
-- Name: consultant_profiles REL_2fd3ae5f95607d9257b7be9680; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT "REL_2fd3ae5f95607d9257b7be9680" UNIQUE (user_id);


--
-- Name: services UQ_02cf0d0f46e11d22d952f623670; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "UQ_02cf0d0f46e11d22d952f623670" UNIQUE (slug);


--
-- Name: categories UQ_420d9f679d41281f282f5bc7d09; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE (slug);


--
-- Name: blogs UQ_7b18faaddd461656ff66f32e2d7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "UQ_7b18faaddd461656ff66f32e2d7" UNIQUE (slug);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: questions UQ_a9cd7cd3b1c78e50d8383aa0d79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "UQ_a9cd7cd3b1c78e50d8383aa0d79" UNIQUE (slug);


--
-- Name: tags UQ_b3aa10c29ea4e61a830362bd25a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE (slug);


--
-- Name: users UQ_bc0c27d77ee64f0a097a5c269b3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_bc0c27d77ee64f0a097a5c269b3" UNIQUE (slug);


--
-- Name: service_packages UQ_d4babd0f20bb305697b3a55f529; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_packages
    ADD CONSTRAINT "UQ_d4babd0f20bb305697b3a55f529" UNIQUE (slug);


--
-- Name: IDX_51fff5114cc41723e8ca36cf22; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_51fff5114cc41723e8ca36cf22" ON public.categories_closure USING btree (id_descendant);


--
-- Name: IDX_ea1e9c4eea91160dfdb4318778; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ea1e9c4eea91160dfdb4318778" ON public.categories_closure USING btree (id_ancestor);


--
-- Name: contract_files FK_004389a38fce6d7f1ba52017f45; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT "FK_004389a38fce6d7f1ba52017f45" FOREIGN KEY (contract_id) REFERENCES public.employment_contracts(id) ON DELETE CASCADE;


--
-- Name: menstrual_cycles FK_0300f99be796fe2765fe8cc148b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycles
    ADD CONSTRAINT "FK_0300f99be796fe2765fe8cc148b" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cycle_symptoms FK_12a8c20bb2bc6051d659425b6b6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT "FK_12a8c20bb2bc6051d659425b6b6" FOREIGN KEY (symptom_id) REFERENCES public.symptoms(id);


--
-- Name: blogs FK_15e57815eaedd8870f7a4ac77b8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "FK_15e57815eaedd8870f7a4ac77b8" FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id);


--
-- Name: blog_service_relations FK_17d0b2c68a2bb25273eabea9fc5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT "FK_17d0b2c68a2bb25273eabea9fc5" FOREIGN KEY (blog_id) REFERENCES public.blogs(id);


--
-- Name: user_package_subscriptions FK_1a96068f61ed3601cf31526403c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT "FK_1a96068f61ed3601cf31526403c" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_package_subscriptions FK_1bffb0300fca6ae29bd3bd8e857; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT "FK_1bffb0300fca6ae29bd3bd8e857" FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: blogs FK_1f073a9f9720fe731423f1064cc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "FK_1f073a9f9720fe731423f1064cc" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: services FK_1f8d1173481678a035b4a81a4ec; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: package_service_usage FK_25e4c177fb1a7172adc7a502a3b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_25e4c177fb1a7172adc7a502a3b" FOREIGN KEY (subscription_id) REFERENCES public.user_package_subscriptions(id);


--
-- Name: consultant_profiles FK_2fb204b305b305f353dfeff2357; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT "FK_2fb204b305b305f353dfeff2357" FOREIGN KEY (verified_by_id) REFERENCES public.users(id);


--
-- Name: consultant_profiles FK_2fd3ae5f95607d9257b7be96806; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT "FK_2fd3ae5f95607d9257b7be96806" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users FK_4241f21b9bb35e82a6217af1aad; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_4241f21b9bb35e82a6217af1aad" FOREIGN KEY (deleted_by_id) REFERENCES public.users(id);


--
-- Name: payments FK_427785468fb7d2733f59e7d7d39; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedbacks FK_4334f6be2d7d841a9d5205a100e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "FK_4334f6be2d7d841a9d5205a100e" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: question_tags FK_497e97015cc760e52aa0b8c2586; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT "FK_497e97015cc760e52aa0b8c2586" FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: menstrual_predictions FK_4a2ccb5f36e4593a76673777c45; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_predictions
    ADD CONSTRAINT "FK_4a2ccb5f36e4593a76673777c45" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories_closure FK_51fff5114cc41723e8ca36cf227; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "FK_51fff5114cc41723e8ca36cf227" FOREIGN KEY (id_descendant) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: questions FK_5800cd25a5888174b2c40e67d4b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "FK_5800cd25a5888174b2c40e67d4b" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cycle_symptoms FK_5aa97fd41483da75216c0c266d6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT "FK_5aa97fd41483da75216c0c266d6" FOREIGN KEY (cycle_id) REFERENCES public.menstrual_cycles(id);


--
-- Name: appointment_services FK_5aafcd787c270f1fd2e01376a6b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b" FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: test_results FK_5daa6f77941b75b77e4f0ed7a26; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT "FK_5daa6f77941b75b77e4f0ed7a26" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: employment_contracts FK_5f04149a75874f468f69151cc4c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contracts
    ADD CONSTRAINT "FK_5f04149a75874f468f69151cc4c" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: questions FK_6004e23393f2a8efe414480b75d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "FK_6004e23393f2a8efe414480b75d" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: contract_files FK_652f3b9e84ac3b8c7703e0a9d7c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT "FK_652f3b9e84ac3b8c7703e0a9d7c" FOREIGN KEY (file_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: appointments FK_66dee3bea82328659a4db8e54b7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "FK_66dee3bea82328659a4db8e54b7" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: answers FK_677120094cf6d3f12df0b9dc5d3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "FK_677120094cf6d3f12df0b9dc5d3" FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: feedbacks FK_729ed648f9b89722ab206e5eb05; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "FK_729ed648f9b89722ab206e5eb05" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: feedbacks FK_7f1eeaf18f601785cd7b51ab6a7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "FK_7f1eeaf18f601785cd7b51ab6a7" FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: package_services FK_88a6b1f9641c4e6e37b385e20bb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT "FK_88a6b1f9641c4e6e37b385e20bb" FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: appointment_services FK_923e323e598280a0454e1d1b7cf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT "FK_923e323e598280a0454e1d1b7cf" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: package_service_usage FK_97f96aff681f5c4a5153c3e48a0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_97f96aff681f5c4a5153c3e48a0" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: categories FK_9a6f051e66982b5f0318981bcaa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES public.categories(id);


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments FK_9f49987820da519f855d04c82bd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_9f49987820da519f855d04c82bd" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: feedbacks FK_9f548bca3d188e26d5ed8cd6d19; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "FK_9f548bca3d188e26d5ed8cd6d19" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: cycle_moods FK_a186ade0a5ca4ae3e5db1c0faa5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT "FK_a186ade0a5ca4ae3e5db1c0faa5" FOREIGN KEY (mood_id) REFERENCES public.moods(id);


--
-- Name: users FK_a2cecd1a3531c0b041e29ba46e1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: blog_service_relations FK_a559233685b8c67e10d303addba; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT "FK_a559233685b8c67e10d303addba" FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: symptoms FK_b28f74a9ebf958778b304b11bb9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT "FK_b28f74a9ebf958778b304b11bb9" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: blogs FK_b324119dcb71e877cee411f7929; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "FK_b324119dcb71e877cee411f7929" FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: blogs FK_b768cb95912657fefdb6bd40665; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT "FK_b768cb95912657fefdb6bd40665" FOREIGN KEY (published_by_id) REFERENCES public.users(id);


--
-- Name: audit_logs FK_bd2726fd31b35443f2245b93ba0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: test_results FK_beeb702014ac9ccbd79b06e2d9f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT "FK_beeb702014ac9ccbd79b06e2d9f" FOREIGN KEY (staff_id) REFERENCES public.users(id);


--
-- Name: documents FK_c7481daf5059307842edef74d73; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "FK_c7481daf5059307842edef74d73" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: consultant_availability FK_c9c0a4758fa91898eb6b301a6ad; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT "FK_c9c0a4758fa91898eb6b301a6ad" FOREIGN KEY (consultant_id) REFERENCES public.consultant_profiles(id);


--
-- Name: question_tags FK_da3d79ee83f674d9f5fc9cc88d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT "FK_da3d79ee83f674d9f5fc9cc88d0" FOREIGN KEY (question_id) REFERENCES public.questions(id);


--
-- Name: images FK_decdf86f650fb765dac7bd091a6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT "FK_decdf86f650fb765dac7bd091a6" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: appointments FK_e423b517ea5503a0da8015c3e28; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "FK_e423b517ea5503a0da8015c3e28" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: appointments FK_e893bbc4b32e207367bcdbee9d3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "FK_e893bbc4b32e207367bcdbee9d3" FOREIGN KEY (availability_id) REFERENCES public.consultant_availability(id);


--
-- Name: categories_closure FK_ea1e9c4eea91160dfdb4318778d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_closure
    ADD CONSTRAINT "FK_ea1e9c4eea91160dfdb4318778d" FOREIGN KEY (id_ancestor) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: user_package_subscriptions FK_eeb528192debfce2869a5aa171c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT "FK_eeb528192debfce2869a5aa171c" FOREIGN KEY (package_id) REFERENCES public.service_packages(id);


--
-- Name: package_services FK_f30752478d9171c81d95b2754d8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT "FK_f30752478d9171c81d95b2754d8" FOREIGN KEY (package_id) REFERENCES public.service_packages(id);


--
-- Name: package_service_usage FK_f45c3723d6506d953a01d48f753; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT "FK_f45c3723d6506d953a01d48f753" FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: answers FK_f9a32ce9c623dc4cf925255a500; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "FK_f9a32ce9c623dc4cf925255a500" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: contraceptive_reminders FK_fbe39128149894cf69ad30c3f24; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminders
    ADD CONSTRAINT "FK_fbe39128149894cf69ad30c3f24" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cycle_moods FK_ff4bc3fc42dd971753ee8b5f5ff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT "FK_ff4bc3fc42dd971753ee8b5f5ff" FOREIGN KEY (cycle_id) REFERENCES public.menstrual_cycles(id);


--
-- PostgreSQL database dump complete
--

