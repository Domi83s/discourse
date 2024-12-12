# frozen_string_literal: true

module RequestTracker
  module RateLimiters
    class IP < Base
      def rate_limit_key
        @request.ip
      end

      def rate_limit_key_description
        "IP address"
      end

      def rate_limit_globally?
        true
      end

      def active?
        true
      end
    end
  end
end
