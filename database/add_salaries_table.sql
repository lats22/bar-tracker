-- Create salaries table for employee salary payments

CREATE TABLE IF NOT EXISTS salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  position VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX idx_salaries_date ON salaries(date);
CREATE INDEX idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX idx_salaries_created_by ON salaries(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
