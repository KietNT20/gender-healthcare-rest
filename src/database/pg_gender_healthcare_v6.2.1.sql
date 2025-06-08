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
-- Name: appointment_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status_type AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
);


ALTER TYPE public.appointment_status_type OWNER TO postgres;

--
-- Name: content_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.content_status_type AS ENUM (
    'draft',
    'pending_review',
    'needs_revision',
    'rejected',
    'approved',
    'published',
    'archived'
);


ALTER TYPE public.content_status_type OWNER TO postgres;

--
-- Name: contract_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contract_status_type AS ENUM (
    'pending',
    'active',
    'expired',
    'terminated',
    'renewed'
);


ALTER TYPE public.contract_status_type OWNER TO postgres;

--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_type AS ENUM (
    'M',
    'F',
    'O'
);


ALTER TYPE public.gender_type OWNER TO postgres;

--
-- Name: location_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.location_type_enum AS ENUM (
    'online',
    'office'
);


ALTER TYPE public.location_type_enum OWNER TO postgres;

--
-- Name: payment_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_type AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status_type OWNER TO postgres;

--
-- Name: priority_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.priority_type AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.priority_type OWNER TO postgres;

--
-- Name: profile_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.profile_status_type AS ENUM (
    'active',
    'on_leave',
    'training',
    'inactive'
);


ALTER TYPE public.profile_status_type OWNER TO postgres;

--
-- Name: question_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_status_type AS ENUM (
    'pending',
    'answered',
    'closed'
);


ALTER TYPE public.question_status_type OWNER TO postgres;

--
-- Name: reminder_frequency_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reminder_frequency_type AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE public.reminder_frequency_type OWNER TO postgres;

--
-- Name: reminder_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reminder_status_type AS ENUM (
    'active',
    'paused',
    'completed'
);


ALTER TYPE public.reminder_status_type OWNER TO postgres;

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
-- Name: service_category_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_category_type AS ENUM (
    'consultation',
    'test',
    'treatment',
    'package'
);


ALTER TYPE public.service_category_type OWNER TO postgres;

--
-- Name: subscription_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_status_type AS ENUM (
    'active',
    'expired',
    'cancelled',
    'suspended'
);


ALTER TYPE public.subscription_status_type OWNER TO postgres;

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
    is_accepted boolean DEFAULT false,
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    is_private boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: appointment_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_services (
    appointment_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    status public.appointment_status_type DEFAULT 'pending'::public.appointment_status_type NOT NULL,
    notes text,
    meeting_link character varying(255),
    reminder_sent boolean DEFAULT false,
    reminder_sent_at timestamp with time zone,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fixed_price numeric(10,2) NOT NULL,
    consultant_selection_type character varying(20) DEFAULT 'system'::character varying NOT NULL,
    appointment_location public.location_type_enum DEFAULT 'office'::public.location_type_enum NOT NULL,
    availability_id uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT appointments_consultant_selection_type_check CHECK (((consultant_selection_type)::text = ANY (ARRAY[('system'::character varying)::text, ('customer'::character varying)::text])))
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
    status character varying(20) DEFAULT 'success'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: blog_service_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_service_relations (
    blog_id uuid NOT NULL,
    service_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    status public.content_status_type DEFAULT 'draft'::public.content_status_type NOT NULL,
    featured_image character varying(255),
    tags text[],
    views integer DEFAULT 0,
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    category_id uuid
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
    parent_id uuid,
    type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: consultant_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_availability (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    consultant_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    max_appointments integer DEFAULT 1 NOT NULL,
    location public.location_type_enum,
    recurring boolean DEFAULT true,
    specific_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT consultant_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT time_order_check CHECK ((start_time < end_time))
);


ALTER TABLE public.consultant_availability OWNER TO postgres;

--
-- Name: consultant_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultant_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    specialization character varying(255) NOT NULL,
    qualification text NOT NULL,
    experience text NOT NULL,
    bio text,
    working_hours jsonb,
    rating numeric(3,2) DEFAULT 0,
    is_available boolean DEFAULT true,
    profile_status public.profile_status_type DEFAULT 'active'::public.profile_status_type,
    certificates jsonb,
    languages text[],
    education_background text,
    consultation_fee numeric(10,2) NOT NULL,
    max_appointments_per_day integer DEFAULT 10 NOT NULL,
    version integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    is_verified boolean DEFAULT false,
    verified_by_id uuid,
    verified_at timestamp with time zone,
    consultation_types public.location_type_enum[] DEFAULT ARRAY['office'::public.location_type_enum] NOT NULL
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
    frequency public.reminder_frequency_type DEFAULT 'daily'::public.reminder_frequency_type NOT NULL,
    status public.reminder_status_type DEFAULT 'active'::public.reminder_status_type NOT NULL,
    days_of_week integer[],
    reminder_message text,
    snooze_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.contraceptive_reminders OWNER TO postgres;

--
-- Name: contract_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_files (
    contract_id uuid NOT NULL,
    file_id uuid NOT NULL,
    file_type character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cycle_moods_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5)))
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cycle_symptoms_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5)))
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
    is_public boolean DEFAULT false,
    is_sensitive boolean DEFAULT false,
    user_id uuid,
    hash character varying(64),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    status public.contract_status_type DEFAULT 'pending'::public.contract_status_type NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
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
    is_anonymous boolean DEFAULT false,
    is_public boolean DEFAULT true,
    staff_response text,
    categories text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT feedbacks_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
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
    is_public boolean DEFAULT false,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    url text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.images OWNER TO postgres;

--
-- Name: COLUMN images.url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.url IS 'URL truy cập trực tiếp đến file ảnh trong cloud storage';


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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT menstrual_cycles_flow_intensity_check CHECK (((flow_intensity >= 1) AND (flow_intensity <= 5))),
    CONSTRAINT menstrual_cycles_pain_level_check CHECK (((pain_level >= 0) AND (pain_level <= 10)))
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
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.menstrual_predictions OWNER TO postgres;

--
-- Name: moods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
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
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url text,
    priority public.priority_type,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    usage_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.package_service_usage OWNER TO postgres;

--
-- Name: TABLE package_service_usage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.package_service_usage IS 'Ghi nhận việc sử dụng dịch vụ trong gói để kiểm soát giới hạn';


--
-- Name: package_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    package_id uuid NOT NULL,
    service_id uuid NOT NULL,
    quantity_limit integer,
    discount_percentage numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.package_services OWNER TO postgres;

--
-- Name: TABLE package_services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.package_services IS 'Chi tiết các dịch vụ trong từng gói với giới hạn và giảm giá';


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    appointment_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    status public.payment_status_type DEFAULT 'pending'::public.payment_status_type NOT NULL,
    transaction_id character varying(255),
    payment_date timestamp with time zone,
    gateway_response jsonb,
    refunded boolean DEFAULT false,
    refund_amount numeric(10,2) DEFAULT 0,
    refund_reason text,
    invoice_number character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: question_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_tags (
    question_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    status public.question_status_type NOT NULL,
    is_public boolean DEFAULT false,
    view_count integer DEFAULT 0,
    is_anonymous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    category_id uuid
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name public.roles_name_enum DEFAULT 'customer'::public.roles_name_enum NOT NULL,
    description character varying(60),
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
    is_active boolean DEFAULT true,
    max_services_per_month integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.service_packages OWNER TO postgres;

--
-- Name: TABLE service_packages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_packages IS 'Bảng quản lý các gói dịch vụ - chỉ cho dịch vụ trực tiếp tại cơ sở y tế (không bao gồm tư vấn)';


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
    is_active boolean DEFAULT true,
    images text[],
    short_description character varying(255),
    prerequisites text,
    post_instructions text,
    featured boolean DEFAULT false,
    version integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    category_id uuid
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.symptoms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category_id uuid,
    deleted_at timestamp with time zone
);


ALTER TABLE public.symptoms OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
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
    is_abnormal boolean DEFAULT false,
    recommendation text,
    viewed_at timestamp with time zone,
    notification_sent boolean DEFAULT false,
    file_uploads text[],
    follow_up_required boolean DEFAULT false,
    follow_up_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
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
    status public.subscription_status_type DEFAULT 'active'::public.subscription_status_type,
    auto_renew boolean DEFAULT false,
    payment_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_package_subscriptions OWNER TO postgres;

--
-- Name: TABLE user_package_subscriptions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_package_subscriptions IS 'Theo dõi việc đăng ký gói dịch vụ của user';


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
    gender public.gender_type,
    phone character varying(20),
    address text,
    role_id uuid,
    profile_picture character varying(255),
    is_active boolean DEFAULT true,
    account_locked_until timestamp with time zone,
    login_attempts integer DEFAULT 0,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    email_verification_expires timestamp with time zone,
    phone_verified boolean DEFAULT false,
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    last_login timestamp with time zone,
    locale character varying(10) DEFAULT 'vi'::character varying,
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
    health_data_consent boolean DEFAULT false,
    version integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    deleted_by_id uuid,
    refresh_token character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: appointment_services appointment_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_pkey PRIMARY KEY (appointment_id, service_id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blog_service_relations blog_service_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT blog_service_relations_pkey PRIMARY KEY (blog_id, service_id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: consultant_availability consultant_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT consultant_availability_pkey PRIMARY KEY (id);


--
-- Name: consultant_profiles consultant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT consultant_profiles_pkey PRIMARY KEY (id);


--
-- Name: contraceptive_reminders contraceptive_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminders
    ADD CONSTRAINT contraceptive_reminders_pkey PRIMARY KEY (id);


--
-- Name: contract_files contract_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT contract_files_pkey PRIMARY KEY (contract_id, file_id);


--
-- Name: cycle_moods cycle_moods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT cycle_moods_pkey PRIMARY KEY (cycle_id, mood_id);


--
-- Name: cycle_symptoms cycle_symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT cycle_symptoms_pkey PRIMARY KEY (cycle_id, symptom_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employment_contracts employment_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contracts
    ADD CONSTRAINT employment_contracts_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: menstrual_cycles menstrual_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycles
    ADD CONSTRAINT menstrual_cycles_pkey PRIMARY KEY (id);


--
-- Name: menstrual_predictions menstrual_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_predictions
    ADD CONSTRAINT menstrual_predictions_pkey PRIMARY KEY (id);


--
-- Name: moods moods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moods
    ADD CONSTRAINT moods_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: package_service_usage package_service_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT package_service_usage_pkey PRIMARY KEY (id);


--
-- Name: package_services package_services_package_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT package_services_package_id_service_id_key UNIQUE (package_id, service_id);


--
-- Name: package_services package_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT package_services_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: question_tags question_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT question_tags_pkey PRIMARY KEY (question_id, tag_id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: questions questions_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_slug_key UNIQUE (slug);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_packages service_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_packages
    ADD CONSTRAINT service_packages_pkey PRIMARY KEY (id);


--
-- Name: service_packages service_packages_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_packages
    ADD CONSTRAINT service_packages_slug_key UNIQUE (slug);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: user_package_subscriptions user_package_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT user_package_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_slug_key UNIQUE (slug);


--
-- Name: idx_answers_accepted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_accepted ON public.answers USING btree (is_accepted);


--
-- Name: idx_answers_consultant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_consultant_id ON public.answers USING btree (consultant_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_answers_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_deleted_at ON public.answers USING btree (deleted_at);


--
-- Name: idx_answers_question_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_answers_question_id ON public.answers USING btree (question_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointment_services_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_services_appointment_id ON public.appointment_services USING btree (appointment_id);


--
-- Name: idx_appointment_services_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointment_services_service_id ON public.appointment_services USING btree (service_id);


--
-- Name: idx_appointments_consultant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_consultant_date ON public.appointments USING btree (consultant_id, appointment_date);


--
-- Name: idx_appointments_consultant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_consultant_id ON public.appointments USING btree (consultant_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);


--
-- Name: idx_appointments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_deleted_at ON public.appointments USING btree (deleted_at);


--
-- Name: idx_appointments_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_location ON public.appointments USING btree (appointment_location);


--
-- Name: idx_appointments_not_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_not_deleted ON public.appointments USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_appointments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_user_id ON public.appointments USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_blog_service_blog_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blog_service_blog_id ON public.blog_service_relations USING btree (blog_id);


--
-- Name: idx_blog_service_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blog_service_service_id ON public.blog_service_relations USING btree (service_id);


--
-- Name: idx_blogs_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_author_id ON public.blogs USING btree (author_id);


--
-- Name: idx_blogs_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_deleted_at ON public.blogs USING btree (deleted_at);


--
-- Name: idx_blogs_not_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_not_deleted ON public.blogs USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_blogs_published_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_published_at ON public.blogs USING btree (published_at);


--
-- Name: idx_blogs_reviewed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_reviewed_by ON public.blogs USING btree (reviewed_by_id);


--
-- Name: idx_blogs_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_slug ON public.blogs USING btree (slug);


--
-- Name: idx_blogs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blogs_status ON public.blogs USING btree (status);


--
-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);


--
-- Name: idx_categories_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_type ON public.categories USING btree (type);


--
-- Name: idx_consultant_avail_consultant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_avail_consultant_id ON public.consultant_availability USING btree (consultant_id);


--
-- Name: idx_consultant_avail_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_avail_day ON public.consultant_availability USING btree (day_of_week);


--
-- Name: idx_consultant_avail_is_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_avail_is_available ON public.consultant_availability USING btree (is_available);


--
-- Name: idx_consultant_profiles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_profiles_deleted_at ON public.consultant_profiles USING btree (deleted_at);


--
-- Name: idx_consultant_profiles_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_profiles_rating ON public.consultant_profiles USING btree (rating);


--
-- Name: idx_consultant_profiles_specialization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_profiles_specialization ON public.consultant_profiles USING btree (specialization);


--
-- Name: idx_consultant_profiles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_profiles_status ON public.consultant_profiles USING btree (profile_status);


--
-- Name: idx_consultant_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultant_profiles_user_id ON public.consultant_profiles USING btree (user_id);


--
-- Name: idx_contraceptive_reminders_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contraceptive_reminders_deleted_at ON public.contraceptive_reminders USING btree (deleted_at);


--
-- Name: idx_contraceptive_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contraceptive_start_date ON public.contraceptive_reminders USING btree (start_date);


--
-- Name: idx_contraceptive_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contraceptive_status ON public.contraceptive_reminders USING btree (status);


--
-- Name: idx_contraceptive_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contraceptive_user_id ON public.contraceptive_reminders USING btree (user_id);


--
-- Name: idx_contract_files_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_files_contract_id ON public.contract_files USING btree (contract_id);


--
-- Name: idx_contract_files_file_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_files_file_id ON public.contract_files USING btree (file_id);


--
-- Name: idx_cycle_moods_cycle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cycle_moods_cycle_id ON public.cycle_moods USING btree (cycle_id);


--
-- Name: idx_cycle_moods_mood_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cycle_moods_mood_id ON public.cycle_moods USING btree (mood_id);


--
-- Name: idx_cycle_symptoms_cycle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cycle_symptoms_cycle_id ON public.cycle_symptoms USING btree (cycle_id);


--
-- Name: idx_cycle_symptoms_symptom_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cycle_symptoms_symptom_id ON public.cycle_symptoms USING btree (symptom_id);


--
-- Name: idx_documents_document_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_document_type ON public.documents USING btree (document_type);


--
-- Name: idx_documents_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_entity ON public.documents USING btree (entity_type, entity_id);


--
-- Name: idx_documents_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id);


--
-- Name: idx_employment_contracts_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employment_contracts_deleted_at ON public.employment_contracts USING btree (deleted_at);


--
-- Name: idx_employment_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employment_contracts_status ON public.employment_contracts USING btree (status);


--
-- Name: idx_employment_contracts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employment_contracts_user_id ON public.employment_contracts USING btree (user_id);


--
-- Name: idx_feedbacks_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_appointment_id ON public.feedbacks USING btree (appointment_id);


--
-- Name: idx_feedbacks_consultant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_consultant_id ON public.feedbacks USING btree (consultant_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_feedbacks_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_deleted_at ON public.feedbacks USING btree (deleted_at);


--
-- Name: idx_feedbacks_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_rating ON public.feedbacks USING btree (rating);


--
-- Name: idx_feedbacks_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_service_id ON public.feedbacks USING btree (service_id);


--
-- Name: idx_feedbacks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedbacks_user_id ON public.feedbacks USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_images_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_entity ON public.images USING btree (entity_type, entity_id);


--
-- Name: idx_images_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_user_id ON public.images USING btree (user_id);


--
-- Name: idx_menstrual_cycles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_cycles_deleted_at ON public.menstrual_cycles USING btree (deleted_at);


--
-- Name: idx_menstrual_cycles_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_cycles_start_date ON public.menstrual_cycles USING btree (cycle_start_date);


--
-- Name: idx_menstrual_cycles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_cycles_user_id ON public.menstrual_cycles USING btree (user_id);


--
-- Name: idx_menstrual_predictions_cycle_start; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_predictions_cycle_start ON public.menstrual_predictions USING btree (predicted_cycle_start);


--
-- Name: idx_menstrual_predictions_ovulation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_predictions_ovulation ON public.menstrual_predictions USING btree (predicted_ovulation_date);


--
-- Name: idx_menstrual_predictions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_menstrual_predictions_user_id ON public.menstrual_predictions USING btree (user_id);


--
-- Name: idx_moods_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moods_deleted_at ON public.moods USING btree (deleted_at);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_package_services_package_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_services_package_id ON public.package_services USING btree (package_id);


--
-- Name: idx_package_services_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_services_service_id ON public.package_services USING btree (service_id);


--
-- Name: idx_package_usage_appointment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_usage_appointment ON public.package_service_usage USING btree (appointment_id);


--
-- Name: idx_package_usage_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_usage_created_at ON public.package_service_usage USING btree (created_at);


--
-- Name: idx_package_usage_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_usage_date ON public.package_service_usage USING btree (usage_date);


--
-- Name: idx_package_usage_subscription; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_package_usage_subscription ON public.package_service_usage USING btree (subscription_id, service_id);


--
-- Name: idx_payments_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_appointment_id ON public.payments USING btree (appointment_id);


--
-- Name: idx_payments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at);


--
-- Name: idx_payments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_deleted_at ON public.payments USING btree (deleted_at);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_payments_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_transaction_id ON public.payments USING btree (transaction_id);


--
-- Name: idx_payments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_question_tags_question_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_tags_question_id ON public.question_tags USING btree (question_id);


--
-- Name: idx_question_tags_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_tags_tag_id ON public.question_tags USING btree (tag_id);


--
-- Name: idx_questions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_created_at ON public.questions USING btree (created_at);


--
-- Name: idx_questions_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_deleted_at ON public.questions USING btree (deleted_at);


--
-- Name: idx_questions_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_slug ON public.questions USING btree (slug);


--
-- Name: idx_questions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_status ON public.questions USING btree (status);


--
-- Name: idx_questions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_user_id ON public.questions USING btree (user_id);


--
-- Name: idx_roles_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_created_at ON public.roles USING btree (created_at);


--
-- Name: idx_roles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_deleted_at ON public.roles USING btree (deleted_at);


--
-- Name: idx_service_packages_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_packages_active ON public.service_packages USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_service_packages_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_packages_slug ON public.service_packages USING btree (slug);


--
-- Name: idx_services_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_active ON public.services USING btree (is_active);


--
-- Name: idx_services_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_deleted_at ON public.services USING btree (deleted_at);


--
-- Name: idx_services_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_featured ON public.services USING btree (featured) WHERE (featured = true);


--
-- Name: idx_services_not_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_not_deleted ON public.services USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_services_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_slug ON public.services USING btree (slug);


--
-- Name: idx_symptoms_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_symptoms_category_id ON public.symptoms USING btree (category_id);


--
-- Name: idx_symptoms_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_symptoms_deleted_at ON public.symptoms USING btree (deleted_at);


--
-- Name: idx_tags_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tags_deleted_at ON public.tags USING btree (deleted_at);


--
-- Name: idx_tags_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tags_slug ON public.tags USING btree (slug);


--
-- Name: idx_test_results_abnormal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_results_abnormal ON public.test_results USING btree (is_abnormal) WHERE (is_abnormal = true);


--
-- Name: idx_test_results_appointment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_results_appointment_id ON public.test_results USING btree (appointment_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_test_results_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_results_deleted_at ON public.test_results USING btree (deleted_at);


--
-- Name: idx_test_results_follow_up; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_results_follow_up ON public.test_results USING btree (follow_up_required) WHERE (follow_up_required = true);


--
-- Name: idx_test_results_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_results_staff_id ON public.test_results USING btree (staff_id);


--
-- Name: idx_user_package_subscriptions_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_package_subscriptions_deleted_at ON public.user_package_subscriptions USING btree (deleted_at);


--
-- Name: idx_user_subscriptions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_subscriptions_active ON public.user_package_subscriptions USING btree (user_id, status) WHERE (status = 'active'::public.subscription_status_type);


--
-- Name: idx_user_subscriptions_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_subscriptions_dates ON public.user_package_subscriptions USING btree (start_date, end_date);


--
-- Name: idx_user_subscriptions_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_subscriptions_user_status ON public.user_package_subscriptions USING btree (user_id, status);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_not_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_not_deleted ON public.users USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_slug ON public.users USING btree (slug);


--
-- Name: answers answers_consultant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: answers answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_availability_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_availability_id_fkey FOREIGN KEY (availability_id) REFERENCES public.consultant_availability(id);


--
-- Name: appointments appointments_consultant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: blog_service_relations blog_service_relations_blog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT blog_service_relations_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) ON DELETE CASCADE;


--
-- Name: blog_service_relations blog_service_relations_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_service_relations
    ADD CONSTRAINT blog_service_relations_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: blogs blogs_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: blogs blogs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: blogs blogs_published_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_published_by_id_fkey FOREIGN KEY (published_by_id) REFERENCES public.users(id);


--
-- Name: blogs blogs_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: consultant_availability consultant_availability_consultant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_availability
    ADD CONSTRAINT consultant_availability_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: consultant_profiles consultant_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT consultant_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: consultant_profiles consultant_profiles_verified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultant_profiles
    ADD CONSTRAINT consultant_profiles_verified_by_id_fkey FOREIGN KEY (verified_by_id) REFERENCES public.users(id);


--
-- Name: contraceptive_reminders contraceptive_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contraceptive_reminders
    ADD CONSTRAINT contraceptive_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contract_files contract_files_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT contract_files_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.employment_contracts(id) ON DELETE CASCADE;


--
-- Name: contract_files contract_files_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_files
    ADD CONSTRAINT contract_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: cycle_moods cycle_moods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT cycle_moods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.menstrual_cycles(id) ON DELETE CASCADE;


--
-- Name: cycle_moods cycle_moods_mood_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_moods
    ADD CONSTRAINT cycle_moods_mood_id_fkey FOREIGN KEY (mood_id) REFERENCES public.moods(id) ON DELETE CASCADE;


--
-- Name: cycle_symptoms cycle_symptoms_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT cycle_symptoms_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.menstrual_cycles(id) ON DELETE CASCADE;


--
-- Name: cycle_symptoms cycle_symptoms_symptom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_symptoms
    ADD CONSTRAINT cycle_symptoms_symptom_id_fkey FOREIGN KEY (symptom_id) REFERENCES public.symptoms(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: employment_contracts employment_contracts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_contracts
    ADD CONSTRAINT employment_contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedbacks feedbacks_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_consultant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: feedbacks feedbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: images images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: menstrual_cycles menstrual_cycles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_cycles
    ADD CONSTRAINT menstrual_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: menstrual_predictions menstrual_predictions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menstrual_predictions
    ADD CONSTRAINT menstrual_predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: package_service_usage package_service_usage_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT package_service_usage_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: package_service_usage package_service_usage_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT package_service_usage_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: package_service_usage package_service_usage_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_service_usage
    ADD CONSTRAINT package_service_usage_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_package_subscriptions(id) ON DELETE CASCADE;


--
-- Name: package_services package_services_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT package_services_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.service_packages(id) ON DELETE CASCADE;


--
-- Name: package_services package_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT package_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: payments payments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: question_tags question_tags_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT question_tags_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: question_tags question_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_tags
    ADD CONSTRAINT question_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: questions questions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: questions questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: symptoms symptoms_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: test_results test_results_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_package_subscriptions user_package_subscriptions_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT user_package_subscriptions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.service_packages(id);


--
-- Name: user_package_subscriptions user_package_subscriptions_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT user_package_subscriptions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: user_package_subscriptions user_package_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_package_subscriptions
    ADD CONSTRAINT user_package_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_deleted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_id_fkey FOREIGN KEY (deleted_by_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

